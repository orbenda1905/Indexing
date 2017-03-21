# Indexing Program

This program parser the files you put in "database_files" folder and indexing the words to mongo collection. 
You must deliver the mongo collection inside /server/indexingDatabase, in the mongoose.connect functions.
This program search options is working with logic Ooperators (AND, OR, NOT).

## Instruction

When loading the page, you can see the already “Loaded” files and what can be load.
In order to load new file to the system, simply mark files from the “Unloaded” column and press “update” button.

In order to disable files’ simply unmark them from the “Loaded” column’ and then search.
Searching

### There are few basic rules for searching:

The phrase must be legal logically (each opening brackets must come with closing ones).
The phrase must start with a word.
Inside brackets there must be at least two words with logical operator.
You must keep spacing between each part in the phrase -> W OP W ( W OP W ).
You can't open brackets immediately after opening brackets->logically it's not needed. wrong example: W ( ( W OP W) OP W ).
