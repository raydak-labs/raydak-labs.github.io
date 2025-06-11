---
title: "Efficiently Processing Large JSON Files in Python Without Loading Everything Into Memory"
date: 2025-06-11T12:00:00+01:00
draft: false
language: en
summary: Learn how to process large JSON datasets efficiently in Python using streaming and minimal memory, with practical code and profiling tips.
description: A practical guide to efficiently processing large JSON files in Python without loading the entire file into memory. Covers streaming with ijson, memory profiling, and best practices for handling big data.
author: raydak
tags: [
    "Python",
    "JSON",
    "Big Data",
    "Streaming",
    "ijson",
    "memory-profiler"
]
categories: [
    "Development",
    "Data Processing"
]
---

## Introduction

Processing large JSON files can quickly exhaust your system's memory if you try to load the entire file at once. This is a common challenge in data engineering, ETL, and analytics workflows. Fortunately, Python offers tools to process such files efficiently by streaming the data and only keeping what's necessary in memory.

This post demonstrates how to use [`ijson`](https://pypi.org/project/ijson/) for streaming JSON parsing and [`memory-profiler`](https://pypi.org/project/memory-profiler/) to monitor memory usage. We'll also show how to set up your environment with [`uv`](https://github.com/astral-sh/uv) for reproducible installs.

## Why Not Just Use `json.load()`?

The standard `json` module's `json.load()` reads the entire file into memory. For files larger than your available RAM, this leads to crashes or severe slowdowns. Instead, streaming parsers like `ijson` process the file incrementally.

## Setting Up Your Environment

First, initialize your Python project with `uv` and add the required dependencies:

```sh
uv init
uv pip install ijson memory-profiler
```

## Streaming JSON Processing Example

Suppose you have a large JSON array of objects and want to filter items matching a specific field (e.g., `"vpn": "ABC"`), writing only those to an output file. Here's how you can do it efficiently:

```python
from memory_profiler import profile
import json
import ijson
import time

backend = ijson  # You can also use ijson.get_backend("yajl2_c") for speed

objects_num = 0

# References:
# https://pythonspeed.com/articles/json-memory-streaming/
# https://www.dataquest.io/blog/python-json-tutorial/
# https://pytutorial.com/python-json-streaming-handle-large-datasets-efficiently/
# https://github.com/kashifrazzaqui/json-streamer

@profile
def filter_large_json(input_file, output_file, target_vpn):
    global objects_num
    with open(input_file, "rb") as infile, open(output_file, "w") as outfile:
        outfile.write("[")
        first = True
        for obj in backend.items(infile, "item"):
            if obj.get("vpn") == target_vpn:
                if not first:
                    outfile.write(",")
                json.dump(obj, outfile)
                first = False
                objects_num += 1
        outfile.write("]")
    print(f"Filtered {objects_num} objects with vpn '{target_vpn}'.")

start_time = time.time()
filter_large_json("test.json", "output.json", "ABC")
print("--- %s seconds ---" % (time.time() - start_time))
```

## Profiling Memory Usage

The `@profile` decorator from `memory-profiler` will show you the memory usage line by line when you run your script with:

```sh
mprof run your_script.py
mprof plot
```

## Conclusion

By streaming your JSON processing, you can handle files of virtually any size, limited only by disk space, not RAM. This approach is essential for scalable data pipelines and analytics.

## References

- [Streaming large JSON files in Python](https://pythonspeed.com/articles/json-memory-streaming/)
- [Python JSON streaming: handle large datasets efficiently](https://pytutorial.com/python-json-streaming-handle-large-datasets-efficiently/)
- [Dataquest: Working with JSON in Python](https://www.dataquest.io/blog/python-json-tutorial/)
- [json-streamer GitHub](https://github.com/kashifrazzaqui/json-streamer)
