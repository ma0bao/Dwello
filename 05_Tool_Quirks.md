# Tool Quirks

- **File I/O**: Use `read_file` (with offset/limit) instead of `cat`, `head`, or `tail`.  
- **Searching**: Use `search_files` (regex or glob) instead of `grep`, `rg`, or `find`.  
- **Editing**: Use `patch` for find‑and‑replace; avoid `sed`/`awk`.  
- **Terminal**: Run foreground commands directly; for long‑running tasks start a background process with `background=true` and `notify_on_complete=true`.  
- **Python**: Import utilities from `hermes_tools` (`read_file`, `write_file`, `terminal`, …) and print results to stdout.  
- **Paths**: Use forward‑slash style (`C:/path/to/file`) or Windows style (`C:\\path\\to\\file`) consistently; the `terminal` tool accepts both.  
- **Line endings**: Files are stored with Windows CRLF line endings; `read_file` returns them as‑is.  
- **Encoding**: UTF‑8 is assumed; avoid non‑UTF‑8 characters unless intentional.  
- **Permissions**: Windows file permissions are not exposed via the tools; rely on the file system ACLs outside of Hermes.  
- **Backup**: The vault is backed by the Git repository; ensure commits are pushed regularly.  