# Environment Details

- **OS**: Windows 10  
- **Shell**: MSYS bash (POSIX‑compatible) used by the `terminal` tool.  
- **File I/O**: Use `read_file`, `write_file`, `search_files`, `patch` instead of `cat`, `grep`, `sed`.  
- **Terminal**: Foreground for quick commands; background with `notify_on_complete` for long tasks.  
- **Python**: Import from `hermes_tools` (`read_file`, `write_file`, `terminal`, …) and print results to stdout.  