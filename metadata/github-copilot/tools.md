# Github Copilot Available Tools and Parameters

1. **create_directory**
   - `dirPath` (string, required): The absolute path to the directory to create.

2. **create_file**
   - `content` (string, required): The content to write to the file.
   - `filePath` (string, required): The absolute path to the file to create.

3. **fetch_webpage**
   - `query` (string, required): The query to search for in the web page's content. This should be a clear and concise description of the content you want to find.
   - `urls` (array of strings, required): An array of URLs to fetch content from.

4. **file_search**
   - `maxResults` (number, optional): The maximum number of results to return. Do not use this unless necessary, it can slow things down. By default, only some matches are returned. If you use this and don't see what you're looking for, you can try again with a more specific query or a larger maxResults.
   - `query` (string, required): Search for files with names or paths matching this glob pattern.

5. **grep_search**
   - `includeIgnoredFiles` (boolean, optional): Whether to include files that would normally be ignored according to .gitignore, other ignore files and `files.exclude` and `search.exclude` settings. Warning: using this may cause the search to be slower. Only set it when you want to search in ignored folders like node_modules or build outputs.
   - `includePattern` (string, optional): Search files matching this glob pattern. Will be applied to the relative path of files within the workspace. To search recursively inside a folder, use a proper glob pattern like "src/folder/**". Do not use | in includePattern.
   - `isRegexp` (boolean, optional): Whether the pattern is a regex.
   - `maxResults` (number, optional): The maximum number of results to return. Do not use this unless necessary, it can slow things down. By default, only some matches are returned. If you use this and don't see what you're looking for, you can try again with a more specific query or a larger maxResults.
   - `query` (string, required): The pattern to search for in files in the workspace. Use regex with alternation (e.g., 'word1|word2|word3') or character classes to find multiple potential words in a single search. Be sure to set the isRegexp property properly to declare whether it's a regex or plain text pattern. Is case-insensitive.

6. **get_changed_files**
   - `repositoryPath` (string, optional): The absolute path to the git repository to look for changes in. If not provided, the active git repository will be used.
   - `sourceControlState` (array of strings, optional): The kinds of git state to filter by. Allowed values are: 'staged', 'unstaged', and 'merge-conflicts'. If not provided, all states will be included.

7. **get_errors**
   - `filePaths` (array of strings, optional): The absolute paths to the files or folders to check for errors. Omit 'filePaths' when retrieving all errors.

8. **github_repo**
   - `query` (string, required): The query to search for repo. Should contain all relevant context.
   - `repo` (string, required): The name of the Github repository to search for code in. Should must be formatted as '<owner>/<repo>'.

9. **list_code_usages**
   - `filePaths` (array of strings, optional): One or more file paths which likely contain the definition of the symbol. For instance the file which declares a class or function. This is optional but will speed up the invocation of this tool and improve the quality of its output.
   - `symbolName` (string, required): The name of the symbol, such as a function name, class name, method name, variable name, etc.

10. **list_dir**
    - `path` (string, required): The absolute path to the directory to list.

11. **read_file**
    - `endLine` (number, required): The inclusive line number to end reading at, 1-based.
    - `filePath` (string, required): The absolute path of the file to read.
    - `startLine` (number, required): The line number to start reading from, 1-based.

12. **replace_string_in_file**
    - `filePath` (string, required): An absolute path to the file to edit.
    - `newString` (string, required): The exact literal text to replace `old_string` with, preferably unescaped. Provide the EXACT text. Ensure the resulting code is correct and idiomatic.
    - `oldString` (string, required): The exact literal text to replace, preferably unescaped. For single replacements (default), include at least 3 lines of context BEFORE and AFTER the target text, matching whitespace and indentation precisely. For multiple replacements, specify expected_replacements parameter. If this string is not the exact literal text (i.e. you escaped it) or does not match exactly, the tool will fail.

13. **get_terminal_output**
    - `id` (string, required): The ID of the terminal to check.

14. **run_in_terminal**
    - `command` (string, required): The command to run in the terminal.
    - `explanation` (string, required): A one-sentence description of what the command does. This will be shown to the user before the command is run.
    - `isBackground` (boolean, required): Whether the command starts a background process. If true, the command will run in the background and you will not see the output. If false, the tool call will block on the command finishing, and then you will get the output. Examples of background processes: building in watch mode, starting a server. You can check the output of a background process later on by using get_terminal_output.

15. **runSubagent**
    - `description` (string, required): A short (3-5 word) description of the task
    - `prompt` (string, required): A detailed description of the task for the agent to perform
