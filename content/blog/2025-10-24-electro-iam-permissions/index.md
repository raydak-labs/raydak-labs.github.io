---
title: "Securing DynamoDB with ElectroDB: Fine-Grained IAM Permissions for Attribute-Level Access Control"
date: 2025-10-24T10:00:00+01:00
draft: false
language: en
summary: Learn how to implement attribute-level access control in DynamoDB using IAM policies with ElectroDB, ensuring users can only access and modify specific data attributes.
description: A comprehensive guide to implementing fine-grained IAM permissions for DynamoDB tables when using ElectroDB. Learn how to restrict access to specific attributes, control partition key access, and secure your single-table design with real-world examples.
author: raydak
tags: [
    "DynamoDB",
    "ElectroDB",
    "IAM",
    "AWS",
    "Security",
    "Access Control"
]
categories: [
    "Development",
    "Security"
]
---

## Introduction

When building serverless applications with DynamoDB, security is paramount. While DynamoDB offers powerful querying capabilities, it doesn't natively provide field-level permissions. That's where AWS IAM policies come in. Combined with [ElectroDB](https://electrodb.dev/)—a TypeScript library that simplifies DynamoDB single-table design—you can implement robust attribute-level access control.

In this post, I'll show you how to restrict access to specific attributes in your DynamoDB tables using IAM condition keys, particularly when working with ElectroDB's entity structure. We'll explore real-world examples of policies that grant or deny access based on attributes and partition keys.

## Understanding the Challenge

ElectroDB abstracts DynamoDB's complexity by managing internal fields like `__edb_e__` (entity type) and `__edb_v__` (version), along with your partition keys (`pk`) and sort keys (`sk`). When implementing IAM policies, you need to account for these ElectroDB-specific fields while also controlling access to your business attributes.

Consider a multi-tenant application where different users should only access their own data. You need to ensure:
- Users can only access items with their own user partition key
- Users can only read/write specific attributes relevant to their permissions
- ElectroDB's internal fields remain accessible for proper operation

## ElectroDB Entity Structure

Let's start with a sample entity representing a user profile in a collaborative workspace application:

```typescript
import { Entity } from "electrodb";

export const UserProfileEntity = new Entity(
  {
    model: {
      entity: "userProfile",
      version: "1",
      service: "workspace",
    },
    attributes: {
      userId: {
        type: "string",
        required: true,
      },
      username: {
        type: "string",
        required: true,
      },
      email: {
        type: "string",
        required: true,
      },
      displayName: {
        type: "string",
        required: false,
      },
      accessToken: {
        type: "string",
        required: false,
      },
      refreshToken: {
        type: "string",
        required: false,
      },
      sshPublicKey: {
        type: "string",
        required: false,
      },
      preferences: {
        type: "map",
        required: false,
      },
      maxProjects: {
        type: "number",
        default: 5,
      },
    },
    indexes: {
      primary: {
        pk: {
          field: "pk",
          composite: ["userId"],
        },
        sk: {
          field: "sk",
          composite: [],
        },
      },
    },
  },
  { 
    table: "workspace-data",
  }
);
```

When ElectroDB performs an update operation, it generates DynamoDB parameters like this:

```javascript
{
  UpdateExpression: "SET #displayName = :displayName_u0, #preferences = :preferences_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
  ExpressionAttributeNames: {
    "#displayName": "displayName",
    "#preferences": "preferences",
    "#__edb_e__": "__edb_e__",
    "#__edb_v__": "__edb_v__",
  },
  ExpressionAttributeValues: {
    ":displayName_u0": "John Developer",
    ":preferences_u0": { theme: "dark", notifications: true },
    ":__edb_e___u0": "userProfile",
    ":__edb_v___u0": "1",
  },
  TableName: "workspace-data",
  Key: {
    pk: "$workspace#userid_john-dev",
    sk: "$userProfile_1",
  },
}
```

Notice how ElectroDB prefixes the partition key with the service name and includes internal metadata fields.

## IAM Policy Fundamentals for DynamoDB

AWS IAM provides several condition keys specifically for DynamoDB fine-grained access control:

- **`dynamodb:LeadingKeys`**: Restricts access based on partition key values
- **`dynamodb:Attributes`**: Limits which attributes can be accessed in operations
- **`dynamodb:Select`**: Controls the type of projection in queries
- **`dynamodb:ReturnValues`**: Restricts what data is returned after write operations

### Critical Requirements

When using `dynamodb:Attributes`, you **must** include:
1. All primary key attributes (`pk`, `sk`)
2. All index key attributes (if querying indexes)
3. ElectroDB's internal fields (`__edb_e__`, `__edb_v__`)
4. Your business attributes that should be accessible

## Example 1: Basic Attribute-Level Access Control

Let's create a policy that allows users to read and update only non-sensitive profile attributes:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowBasicProfileAttributeAccess",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:UpdateItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:eu-central-1:123456789012:table/workspace-data"
      ],
      "Condition": {
        "ForAllValues:StringEquals": {
          "dynamodb:Attributes": [
            "pk",
            "sk",
            "__edb_e__",
            "__edb_v__",
            "userId",
            "username",
            "displayName",
            "email",
            "preferences",
            "maxProjects"
          ]
        },
        "StringEqualsIfExists": {
          "dynamodb:Select": "SPECIFIC_ATTRIBUTES"
        }
      }
    }
  ]
}
```

**What this policy allows:**
- ✅ Read and update `username`, `displayName`, `email`, and `preferences`
- ✅ Query user profiles with ElectroDB
- ✅ ElectroDB can manage its internal fields

**What this policy denies:**
- ❌ Access to `accessToken`, `refreshToken`, or `sshPublicKey`
- ❌ Using `PutItem` (which could overwrite all attributes)
- ❌ Using `DeleteItem` (not listed in actions)

## Example 2: Partition Key-Based Multi-Tenancy

For multi-tenant applications, you want to ensure users only access their own profile data:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "RestrictAccessToOwnProfile",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:UpdateItem",
        "dynamodb:PutItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:eu-central-1:123456789012:table/workspace-data"
      ],
      "Condition": {
        "ForAllValues:StringLike": {
          "dynamodb:LeadingKeys": [
            "$workspace#userid_${aws:userid}*"
          ]
        },
        "ForAllValues:StringEquals": {
          "dynamodb:Attributes": [
            "pk",
            "sk",
            "__edb_e__",
            "__edb_v__",
            "userId",
            "username",
            "displayName",
            "email",
            "preferences"
          ]
        },
        "StringEqualsIfExists": {
          "dynamodb:Select": "SPECIFIC_ATTRIBUTES"
        }
      }
    }
  ]
}
```

**What this policy allows:**
- ✅ Access only to items where partition key matches the user's ID
- ✅ Users can manage their own profile data
- ✅ Update specific allowed attributes

**What this policy denies:**
- ❌ Accessing other users' data
- ❌ Modifying `accessToken`, `refreshToken`, or `sshPublicKey`
- ❌ Scanning the entire table (Scan not in actions)

## Example 3: Read-Only Access with Attribute Restrictions

For reporting or monitoring use cases, you might want read-only access to specific attributes:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadOnlyUserStatistics",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:BatchGetItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:eu-central-1:123456789012:table/workspace-data"
      ],
      "Condition": {
        "ForAllValues:StringEquals": {
          "dynamodb:Attributes": [
            "pk",
            "sk",
            "__edb_e__",
            "__edb_v__",
            "userId",
            "username",
            "displayName",
            "maxProjects"
          ]
        },
        "StringEquals": {
          "dynamodb:Select": "SPECIFIC_ATTRIBUTES"
        }
      }
    }
  ]
}
```

**What this policy allows:**
- ✅ Read usernames, display names, and project limits
- ✅ Query multiple user profiles
- ✅ Batch read operations

**What this policy denies:**
- ❌ Any write operations
- ❌ Access to sensitive fields (tokens, keys, email)
- ❌ Reading all attributes (must specify attributes)

## Example 4: Preventing Updates to Critical Attributes

Sometimes you want to allow updates but prevent changes to specific critical attributes:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PreventCriticalAttributeUpdates",
      "Effect": "Allow",
      "Action": [
        "dynamodb:UpdateItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:eu-central-1:123456789012:table/workspace-data"
      ],
      "Condition": {
        "ForAllValues:StringNotLike": {
          "dynamodb:Attributes": [
            "accessToken",
            "refreshToken",
            "sshPublicKey"
          ]
        },
        "StringEquals": {
          "dynamodb:ReturnValues": [
            "NONE",
            "UPDATED_OLD",
            "UPDATED_NEW"
          ]
        }
      }
    }
  ]
}
```

**What this policy allows:**
- ✅ Update any attribute except the blocked ones
- ✅ Controlled return values to prevent data leakage

**What this policy denies:**
- ❌ Updating `accessToken`, `refreshToken`, or `sshPublicKey`
- ❌ Returning all old/new values (prevents reading restricted attributes)

## Testing Your IAM Policies

### Scenario 1: Allowed Operation

A user tries to update their display name:

```typescript
await UserProfileEntity.update({ userId: "john-dev" })
  .set({ displayName: "John Smith" })
  .go();
```

**Result**: ✅ **Success** - `displayName` is in the allowed attributes list

### Scenario 2: Denied Operation - Restricted Attribute

A user tries to update their access token:

```typescript
await UserProfileEntity.update({ userId: "john-dev" })
  .set({ accessToken: "new-token-xyz789" })
  .go();
```

**Result**: ❌ **AccessDeniedException** - `accessToken` is not in the allowed attributes

### Scenario 3: Denied Operation - Wrong Partition Key

A user tries to access another user's profile:

```typescript
await UserProfileEntity.get({ userId: "different-user" }).go();
```

**Result**: ❌ **AccessDeniedException** - Partition key doesn't match user's allowed pattern

### Scenario 4: Allowed Batch Read

A user queries their own profile data:

```typescript
const { data } = await UserProfileEntity.query
  .primary({ userId: "john-dev" })
  .go();
```

**Result**: ✅ **Success** - Query on own partition key with allowed attributes

## Best Practices

1. **Always Include ElectroDB Fields**: Don't forget `__edb_e__`, `__edb_v__`, `pk`, and `sk` in your attribute lists
2. **Use ForAllValues:StringEquals**: This ensures all accessed attributes are in your allow list
3. **Combine with LeadingKeys**: Implement multi-tenancy by restricting partition key access
4. **Avoid Deny-Based Policies**: Allow-based policies are easier to maintain and less error-prone
5. **Test Thoroughly**: Use AWS Policy Simulator or actual test accounts to verify policies
6. **Use StringEqualsIfExists**: Prevents users from bypassing restrictions by omitting parameters
7. **Restrict ReturnValues**: Prevent data leakage by controlling what's returned after writes
8. **Document Your Policies**: Clearly comment which attributes are sensitive and why

## Common Pitfalls

### Pitfall 1: Forgetting Primary Keys

```json
"dynamodb:Attributes": [
  "username",
  "displayName"
]
```

❌ This will **fail** because DynamoDB needs `pk` and `sk` to identify items!

### Pitfall 2: Missing ElectroDB Fields

```json
"dynamodb:Attributes": [
  "pk",
  "sk",
  "username"
]
```

❌ ElectroDB operations will **fail** without `__edb_e__` and `__edb_v__`!

### Pitfall 3: Using PutItem with Attribute Restrictions

`PutItem` replaces the entire item, which can bypass attribute-level restrictions. Always exclude `PutItem` when you want attribute-level control, or use `UpdateItem` instead.

## Conclusion

Implementing fine-grained access control in DynamoDB with ElectroDB requires careful consideration of both AWS IAM condition keys and ElectroDB's internal structure. By combining `dynamodb:Attributes` for attribute-level control with `dynamodb:LeadingKeys` for partition-based access, you can build secure multi-tenant applications with precise permissions.

Remember:
- Always include ElectroDB's internal fields in your policies
- Test your policies thoroughly before deploying to production
- Use allow-based policies for better maintainability
- Combine multiple condition keys for defense-in-depth security

With these patterns, you can confidently secure your DynamoDB tables and ensure users only access the data they're authorized to see.

## References

- [AWS DynamoDB IAM Policy Conditions](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/specifying-conditions.html)
- [ElectroDB Documentation](https://electrodb.dev/)
- [IAM Policy Examples for DynamoDB](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_examples_dynamodb_attributes.html)
- [DynamoDB Fine-Grained Access Control](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/specifying-conditions.html)
