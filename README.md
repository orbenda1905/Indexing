# Indexing Program

This progaram parse the files you put in "database_files" folder and puts the words in mongo collection.
You must deliver the mongo collection inside inside /server/indexingDatabase, in the mongoose.connect functions.
This program search options is working with logic Ooperators (AND, OR, NOT).


## Instruction

When loading the page, you can see the already “Loaded” files and what can be load.
In order to load new file to the system, simply mark files from the “Unloaded” column and press “update” button.

In order to disable files’ simply unmark them from the “Loaded” column’ and then search.
Searching

There are few basic rules for searching:

1)The phrase must be legal logically (each opening brackets must come with closing ones).
2)The phrase must start with a word.
3)Inside brackets there must be at least two words with logical operator.
4)You must keep spacing between each part in the phrase -> W OP W ( W OP W ).
5)You can't open brackets immediately after opening brackets->logically it's not needed. wrong example: W ( ( W OP W) OP W ).
