---
adr: 280
date: 2025-01-15
title: Binary Management in Creator Hub
authors:
  - cazala
status: Final
type: Standards Track
spdx-license: CC0-1.0
---

# Abstract

This document describes the approach for managing Node.js binaries and their execution within the Creator Hub Electron application. It outlines the challenges of distributing Node.js-based tools within an ASAR archive and presents a solution for cross-platform binary execution.

# Introduction

The Creator Hub needs to run various Node.js-based tools and binaries (like `@dcl/sdk-commands`) to function properly. This presents several challenges in the context of an Electron application:

1. The app needs Node.js to run these binaries
2. NPM is required to manage and install dependencies
3. The app is packaged in an ASAR archive for distribution
4. Binary execution needs to work cross-platform (Windows and macOS)

## ASAR Archive Requirements

ASAR (Atom Shell Archive) is crucial for our distribution process, particularly for macOS:

- Apple's requirements for app distribution mandate proper signing and notarization
- ASAR provides a way to package the application into a single file that can be properly signed
- It's similar to a ZIP file but designed specifically for Electron apps
- Files within ASAR can be read using Node.js APIs as if they were in a normal directory
- However, binaries within ASAR cannot be executed directly, which is why some files must remain outside

## The PATH Environment Variable

The `$PATH` environment variable is fundamental to how operating systems locate executable programs:

- It's a list of directories separated by colons (Unix) or semicolons (Windows)
- When a command is run, the system searches these directories in order to find the executable
- In our case, we need to modify the `$PATH` to ensure our forked processes can find:
  1. Our Node.js binary (the Electron binary symlink/cmd)
  2. The NPM binaries
  3. Any other binaries installed by NPM
  4. The system's original executables

# Decision

We've implemented a multi-layered approach to handle binary execution:

## Node.js Binary Management

Instead of bundling a separate Node.js binary, we utilize Electron's built-in Node.js runtime. Electron is built on Node.js, making its binary capable of running Node.js code. To make this work:

- On macOS: Create a symlink named `node` pointing to the Electron binary
- On Windows: Create a `.cmd` file that redirects to the Electron binary

## NPM and Package Management

To handle NPM and package management:

1. The `package.json` and NPM binaries are kept outside the ASAR archive
2. NPM binaries are accessed using the Node.js symlink/cmd created above
3. The `$PATH` environment variable is modified in forked processes to include:
   - The directory containing our Node.js symlink/cmd
   - The directory containing NPM binaries
   - The system's original `$PATH`

## Installation Process

The installation process follows these steps:

1. Create Node.js symlink/cmd pointing to Electron binary
2. Set up proper `$PATH` environment variable
3. Use the Node.js symlink to run NPM
4. Install dependencies from the unpackaged `package.json`
5. Track installation versions to handle updates

## Running Arbitrary Binaries

To run binaries like `sdk-commands`:

1. Fork a new process using Electron's `utilityProcess`
2. Inject the modified `$PATH` containing Node.js and NPM locations
3. Execute the binary using the forked process
4. Provide utilities for output handling and process management

## Process Monitoring

The forked processes are augmented with monitoring capabilities through a wrapper that provides:

1. Pattern-based Output Monitoring

   - `on(pattern, handler)`: Subscribe to output matching a RegExp pattern
   - `once(pattern, handler)`: Listen for a single pattern match
   - `off(index)`: Unsubscribe from a pattern
   - Supports filtering by stream type (stdout, stderr, or both)

2. Process Control

   - `wait()`: Promise that resolves with complete output or rejects on error
   - `waitFor(resolvePattern, rejectPattern)`: Promise that resolves/rejects based on output patterns
   - `kill()`: Graceful process termination with force-kill fallback
   - `alive()`: Check if process is still running

3. Logging and Debugging
   - Automatic logging of process execution details
   - Process lifecycle events (spawn, exit)
   - Output streaming to application logs
   - Error handling with detailed context

Example monitoring usage:

```typescript
const process = run("@dcl/sdk-commands", "sdk-commands", {
  args: ["start"],
});

// Wait for specific output
await process.waitFor(/Server is listening/);

// Monitor errors
process.on(/Error:/, (error) => {
  console.error("SDK error:", error);
});

// Graceful shutdown
await process.kill();
```

# Consequences

## Positive

- No need to bundle separate Node.js runtime
- Cross-platform compatibility
- Clean separation between packaged and executable files
- Reliable binary execution environment

## Negative

- Complex setup process
- Dependency on Electron's Node.js version
- Need to maintain files outside ASAR archive

## Risks

- Electron Node.js version updates might affect compatibility
- Cross-platform differences in binary execution
- Installation process interruption handling

# Implementation Details

```typescript
// Example of PATH setup
PATH = joinEnvPaths(
  path.dirname(nodeCmdPath), // Node.js location
  path.dirname(npmBinPath), // NPM location
  process.env.PATH // System PATH
);

// Example of binary execution run(package, bin, args)
const child = run("@dcl/sdk-commands", "sdk-commands", {
  args: ["start"],
});
```

# References

- [Electron ASAR Documentation](https://www.electronjs.org/docs/latest/tutorial/asar-archives)
- [Node.js Process Documentation](https://nodejs.org/api/process.html#process_process_env)
