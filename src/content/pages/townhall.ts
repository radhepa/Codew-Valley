import type { CodexPage } from "../types.ts";

// Codex pages for Town Hall (building 9): files and CSV.
// Page ids must be unique across the whole Codex (content tests check).
// Every example runs in an empty folder, so an example that reads a file
// writes it first.
const r = String.raw;

export const TOWNHALL_PAGES: CodexPage[] = [
  {
    id: "files-reading",
    title: "Opening and reading files",
    summary: "open() a file by name and .read() everything in it as one string.",
    blocks: [
      { p: "A **file** is text with a name, kept in a folder. Your program runs inside the rune stone's folder, so it can open any file in there by its name. A challenge's starting files are listed under its task." },
      { h: "open, read, close" },
      { p: "`open(name)` finds the file and hands you a **file object**: a handle on the file, not the text itself. Ask the handle for `.read()` and you get everything inside as one string. When you've finished, `.close()` lets go of the file." },
      { code: r`# (first, make a little file, so there is something to read)
f = open("pantry.txt", "w")
f.write("3 jars of honey\n2 wheels of cheese\n")
f.close()

f = open("pantry.txt")
text = f.read()
f.close()
print(text)`, out: "3 jars of honey\n2 wheels of cheese" },
      { p: "Print the handle instead of the text and Python only describes it, something like `<_io.TextIOWrapper name='pantry.txt' mode='r' ...>`. Forget the brackets on `.read` and you get `<built-in method read ...>`. Both mean the words are still inside the file." },
      { h: "It's just a string" },
      { p: "What `.read()` gives back is an ordinary string, so everything you know about strings works on it. The end of every line is in there too, as a `\\n` character: a character like any other, so `len()` counts it, and `.count()` can look for it." },
      { code: r`f = open("pantry.txt", "w")
f.write("figs\nplums\n")
f.close()

f = open("pantry.txt")
text = f.read()
f.close()
print(text.count("\n"), "line breaks")
print(text.upper())`, out: "2 line breaks\nFIGS\nPLUMS" },
      { tip: "A file object keeps its place, like a bookmark. After one `.read()` it's at the end, so a second `.read()` gives `\"\"`. Keep the text in a variable and use the variable as often as you like." },
      { h: "A name that isn't there" },
      { p: "The name has to match exactly, capitals, dot and all. If there's no file by that name, Python stops with a **FileNotFoundError**." },
      { code: r`f = open("pantr.txt")`, err: "FileNotFoundError" },
      { tip: "The file name is text, so it goes in quotes: `open(\"pantry.txt\")`. Without quotes, Python looks for a variable and gives a NameError instead." },
    ],
  },
  {
    id: "files-lines",
    title: "A file, line by line",
    summary: "Loop over a file's lines, strip the \\n, skip empty lines, count lines and words.",
    blocks: [
      { p: "A `for` loop over a file object gives you the file **one line per round**. Each line still ends with its line break `\\n`, and `print` adds a line break of its own, so you get a gap after every line:" },
      { code: r`f = open("birds.txt", "w")
f.write("robin\nwren\n")
f.close()

f = open("birds.txt")
for line in f:
    print(line)
f.close()`, out: "robin\n\nwren" },
      { p: "`.strip()` takes the `\\n` off (and any spaces at either end), so each line prints on its own with no gap:" },
      { code: r`f = open("birds.txt", "w")
f.write("robin\nwren  \n")
f.close()

f = open("birds.txt")
for line in f:
    print(line.strip() + "!")
f.close()`, out: "robin!\nwren!" },
      { h: "Empty lines" },
      { p: "An empty line is just `\\n`, and once it's stripped, nothing is left but `\"\"`, which counts as False. A line of only spaces strips down to `\"\"` too. So a stripped line can stand on its own as a question: is anything here?" },
      { code: r`f = open("birds.txt", "w")
f.write("robin\n\n   \nwren\n")
f.close()

birds = []
gaps = 0
f = open("birds.txt")
for line in f:
    if line.strip():
        birds.append(line.strip())
    else:
        gaps += 1
f.close()
print(birds, "and", gaps, "empty lines")`, out: "['robin', 'wren'] and 2 empty lines" },
      { h: "Counting lines and words" },
      { p: "A counter that goes up once per round counts lines. `.split()` with nothing in the brackets cuts a line into its words, wherever there are spaces, so `len()` of that list is the line's word count." },
      { code: r`f = open("song.txt", "w")
f.write("hey diddle diddle\nthe cat and the fiddle\n")
f.close()

lines = 0
words = 0
f = open("song.txt")
for line in f:
    lines += 1
    words += len(line.split())
f.close()
print(lines, "lines,", words, "words")`, out: "2 lines, 8 words" },
      { p: "Careful with `.split(\"\\n\")` on the whole text: a file that ends with a line break leaves an empty piece after it." },
      { code: r`text = "one\ntwo\n"
print(text.split("\n"))`, out: "['one', 'two', '']" },
      { h: "All the lines in a list" },
      { p: "`.readlines()` gives every line at once, as a list of strings (each still ending in `\\n`). Then list tools work: `len()` counts the lines, and a slice like `[1:]` skips the first one." },
      { code: r`f = open("birds.txt", "w")
f.write("BIRDS\nrobin\nwren\n")
f.close()

f = open("birds.txt")
all_lines = f.readlines()
f.close()
print(len(all_lines))
for line in all_lines[1:]:
    print(line.strip())`, out: "3\nrobin\nwren" },
      { tip: "A file object can only be walked through once: a second loop over the same handle gets nothing, because it's already at the end. Open the file again, or keep the lines in a list." },
    ],
  },
  {
    id: "files-writing",
    title: "Writing and adding to files",
    summary: "open(name, \"w\") writes a fresh file, \"a\" adds to the end; write() needs \\n and strings.",
    blocks: [
      { p: "Give `open` a second piece of text, the **mode**, and you can write. `\"w\"` opens the file for writing: it makes the file if it isn't there, and **empties it** if it is. Then `.write(text)` puts text in." },
      { code: r`f = open("shopping.txt", "w")
f.write("eggs\n")
f.write("butter\n")
f.close()

f = open("shopping.txt")
print(f.read())
f.close()`, out: "eggs\nbutter" },
      { p: "`write` puts in exactly what you give it, and nothing more: no space, and no line break. If you want a new line, end the text with `\\n` yourself. Leave it out and everything runs together:" },
      { code: r`f = open("shopping.txt", "w")
f.write("eggs")
f.write("butter")
f.close()

f = open("shopping.txt")
print(f.read())
f.close()`, out: "eggsbutter" },
      { h: "Only text" },
      { p: "`write` only takes strings. Turn a number into text with `str()` or an f-string first:" },
      { code: r`f = open("shopping.txt", "w")
f.write(12)`, err: "TypeError" },
      { code: r`apples = 12
f = open("shopping.txt", "w")
f.write(f"{apples} apples\n")
f.close()

f = open("shopping.txt")
print(f.read())
f.close()`, out: "12 apples" },
      { h: "Close it, or it may not be there" },
      { p: "Python saves up what you write and puts it into the file in batches. Closing the file is what sends the last batch in. Read a file you're still writing to and it can look empty:" },
      { code: r`f = open("note.txt", "w")
f.write("back soon\n")

g = open("note.txt")
print(len(g.read()))
g.close()
f.close()`, out: "0" },
      { h: "Adding to the end: \"a\"" },
      { p: "`\"a\"` (append) keeps what's in the file and adds your writing to the end. Use it for anything you keep adding to, like a diary or a log." },
      { code: r`f = open("diary.txt", "w")
f.write("Monday: rain\n")
f.close()

f = open("diary.txt", "a")
f.write("Tuesday: more rain\n")
f.close()

f = open("diary.txt")
print(f.read())
f.close()`, out: "Monday: rain\nTuesday: more rain" },
      { p: "The three modes: `\"r\"` reads (it's what you get if you give no mode), `\"w\"` writes a fresh file, and `\"a\"` adds to the end of one." },
      { tip: "`\"w\"` empties the file the moment it opens, before you've written a single thing. Open a file you meant to keep with `\"w\"` and it's gone. When in doubt, ask: start fresh, or add on?" },
    ],
  },
  {
    id: "with",
    title: "with: files that close themselves",
    summary: "with open(...) as f: opens a file for the indented lines and closes it after.",
    blocks: [
      { p: "Forgetting `.close()` is easy, and the file may end up empty or half written. A **with block** closes the file for you: it opens the file, runs the indented lines, and closes it the moment the block ends, even if something goes wrong inside." },
      { code: r`with open("jam.txt", "w") as f:
    f.write("plum\n")
    f.write("damson\n")

with open("jam.txt") as f:
    text = f.read()
print(text)`, out: "plum\ndamson" },
      { p: "Read it as English: *with* this file open, call it `f`, and do these things. The name after `as` is yours to choose." },
      { h: "After the block, it's closed" },
      { code: r`with open("jam.txt", "w") as f:
    f.write("quince\n")
print(f.closed)`, out: "True" },
      { p: "So anything that reads or writes the file belongs inside the block. Reading after the block has ended is an error:" },
      { code: r`with open("jam.txt", "w") as f:
    f.write("quince\n")

with open("jam.txt") as f:
    first = f.read()
print(f.read())`, err: "ValueError" },
      { h: "Two files at once" },
      { p: "A `with` block can sit inside another one, so you can read from one file while you write into another:" },
      { code: r`with open("jam.txt", "w") as f:
    f.write("plum\ndamson\n")

with open("jam.txt") as old:
    with open("labels.txt", "w") as new:
        for line in old:
            new.write(line.upper())

with open("labels.txt") as f:
    print(f.read())`, out: "PLUM\nDAMSON" },
      { tip: "From the Town Hall on, open every file with `with`. It's what Python programmers use every day, and it means you never have to remember to close anything." },
    ],
  },
  {
    id: "records",
    title: "Records and fields",
    summary: "One line per record, fields split at commas, a header line to skip, numbers to int().",
    blocks: [
      { p: "Lists of things are often kept one **record** per line, with the parts of each record, its **fields**, separated by commas. The first line usually names the columns, so you know which field is which." },
      { code: r`with open("naps.txt", "w") as f:
    f.write("cat,naps,spot\nMoss,4,windowsill\nBiscuit,7,oven\n")

with open("naps.txt") as f:
    print(f.read())`, out: "cat,naps,spot\nMoss,4,windowsill\nBiscuit,7,oven" },
      { h: "Cutting a record into fields" },
      { p: "`.strip()` takes off the line break and `.split(\",\")` cuts the record at its commas. Unpacking gives each field a name. Every field is text, so turn numbers into numbers with `int()`:" },
      { code: r`record = "Biscuit,7,oven\n"
cat, naps, spot = record.strip().split(",")
print(cat, "naps", int(naps) * 2, "times a weekend, in the", spot)`, out: "Biscuit naps 14 times a weekend, in the oven" },
      { h: "Skipping the header" },
      { p: "The column names are a line too, but not a record: `int(\"naps\")` would be a ValueError. `.readlines()` gives every line in a list, and a slice from 1 leaves the header out:" },
      { code: r`with open("naps.txt", "w") as f:
    f.write("cat,naps,spot\nMoss,4,windowsill\nBiscuit,7,oven\n")

with open("naps.txt") as f:
    records = f.readlines()[1:]

sunny = 0
for record in records:
    cat, naps, spot = record.strip().split(",")
    if spot == "windowsill":
        sunny += int(naps)
print(sunny, "naps in the sun")`, out: "4 naps in the sun" },
      { tip: "If a field could ever have a comma of its own (an address, a description), `split(\",\")` will cut it in the wrong place. The CSV pages show the tool for that." },
    ],
  },
  {
    id: "csv-reading",
    title: "CSV files and csv.reader",
    summary: "Comma-separated records; why split breaks on quoted commas; import csv and csv.reader.",
    blocks: [
      { p: "Records are often kept as **CSV** (comma-separated values): one record per line, with commas between the **fields**. The first line usually names the columns." },
      { code: r`with open("cats.csv", "w") as f:
    f.write("name,colour,naps\nMoss,grey,4\nBiscuit,ginger,7\n")

with open("cats.csv") as f:
    print(f.read())`, out: "name,colour,naps\nMoss,grey,4\nBiscuit,ginger,7" },
      { h: "When a field has a comma in it" },
      { p: "A field can hold a comma of its own if it's wrapped in double quotes: `Moss,\"grey, with a white chin\",4`. That's still three fields. `split(\",\")` doesn't know about quotes, though, and cuts at every comma:" },
      { code: r`record = 'Moss,"grey, with a white chin",4'
print(record.split(","))`, out: "['Moss', '\"grey', ' with a white chin\"', '4']" },
      { h: "csv.reader" },
      { p: "Python's `csv` module knows the quoting rules. `import csv`, then `csv.reader(f)` on an open file gives you one **list of fields** per row, quotes taken care of:" },
      { code: r`import csv

with open("cats.csv", "w") as f:
    f.write('name,colour,naps\nMoss,"grey, with a white chin",4\nBiscuit,ginger,7\n')

with open("cats.csv", newline="") as f:
    for row in csv.reader(f):
        print(row)`, out: "['name', 'colour', 'naps']\n['Moss', 'grey, with a white chin', '4']\n['Biscuit', 'ginger', '7']" },
      { p: "The `newline=\"\"` in `open` is what the csv module asks for: it lets the module handle line endings itself. Use it whenever you open a CSV file." },
      { h: "Skipping the header" },
      { p: "The first row is the column names, not a record. Turn the reader into a list, and the rows after the first are a slice away. Unpacking names each field:" },
      { code: r`import csv

with open("cats.csv", "w") as f:
    f.write("name,colour,naps\nMoss,grey,4\nBiscuit,ginger,7\n")

with open("cats.csv", newline="") as f:
    rows = list(csv.reader(f))

total = 0
for name, colour, naps in rows[1:]:
    total += int(naps)
print(total, "naps")`, out: "11 naps" },
      { tip: "Every field comes out as a string, numbers included: `\"4\"`, not `4`. Use `int()` before you add or compare them." },
    ],
  },
  {
    id: "csv-dicts",
    title: "csv.DictReader: rows by column name",
    summary: "Each row becomes a dictionary keyed by the header, so column order doesn't matter.",
    blocks: [
      { p: "`csv.DictReader` reads the header line for you and turns every row after it into a **dictionary**: the column names are the keys. So you look a field up by its name instead of its position." },
      { code: r`import csv

with open("hives.csv", "w") as f:
    f.write("hive,bees,honey\nNorth,300,4\nSouth,450,6\n")

with open("hives.csv", newline="") as f:
    for row in csv.DictReader(f):
        print(row["hive"], "gave", row["honey"], "jars")`, out: "North gave 4 jars\nSouth gave 6 jars" },
      { h: "The column order stops mattering" },
      { p: "If someone sends the same records with the columns in another order, `row[2]` would suddenly mean something else, but `row[\"honey\"]` still means honey:" },
      { code: r`import csv

with open("hives.csv", "w") as f:
    f.write("honey,hive,bees\n4,North,300\n6,South,450\n")

jars = 0
with open("hives.csv", newline="") as f:
    for row in csv.DictReader(f):
        jars += int(row["honey"])
print(jars, "jars")`, out: "10 jars" },
      { h: "Still strings" },
      { p: "The values are strings, just like with `csv.reader`. That matters most when you compare: text is compared letter by letter, so `\"9\"` comes after `\"12\"`." },
      { code: r`print("9" > "12")
print(int("9") > int("12"))`, out: "True\nFalse" },
      { tip: "A misspelled column name gives a KeyError, just like any dictionary. Check the header line of the file for the exact names." },
    ],
  },
  {
    id: "csv-writing",
    title: "Writing CSV, and updating a file",
    summary: "csv.writer, csv.DictWriter, and the read-change-write-back pattern.",
    blocks: [
      { p: "`csv.writer(f)` writes rows for you. `writerow` takes a **list** of fields and writes one row; any field with a comma in it gets its quotes automatically. Open the file with `\"w\"` and `newline=\"\"`." },
      { code: r`import csv

with open("pets.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["name", "kind"])
    writer.writerow(["Moss", "cat"])
    writer.writerow(["Puddle", "dog, mostly"])

with open("pets.csv") as f:
    print(f.read())`, out: "name,kind\nMoss,cat\nPuddle,\"dog, mostly\"" },
      { p: "`writerows` takes a list of rows (a list of lists) and writes them all at once. Numbers are fine here: the writer turns them into text." },
      { h: "csv.DictWriter" },
      { p: "If your records are dictionaries, `csv.DictWriter` takes the column names as `fieldnames`. `writeheader()` writes the header line, and `writerow` takes one dictionary." },
      { code: r`import csv

with open("pets.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["name", "legs"])
    writer.writeheader()
    writer.writerow({"name": "Moss", "legs": 4})
    writer.writerow({"name": "Pip", "legs": 0})

with open("pets.csv") as f:
    print(f.read())`, out: "name,legs\nMoss,4\nPip,0" },
      { h: "Read, change, write back" },
      { p: "To change a file, read **all** of it first and keep it in a list. Let that `with` block end. Then open the file again with `\"w\"` and write the changed version. Opening with `\"w\"` first would empty the file before you'd read a word of it." },
      { code: r`import csv

with open("stock.csv", "w", newline="") as f:
    csv.writer(f).writerows([["item", "count"], ["pears", "3"], ["figs", "5"]])

# 1. read everything
with open("stock.csv", newline="") as f:
    rows = list(csv.reader(f))

# 2. change it
for row in rows[1:]:
    row[1] = int(row[1]) * 2

# 3. write it all back
with open("stock.csv", "w", newline="") as f:
    csv.writer(f).writerows(rows)

with open("stock.csv") as f:
    print(f.read())`, out: "item,count\npears,6\nfigs,10" },
      { tip: "Writing CSV by hand with `f.write(name + \",\" + kind)` works until a field has a comma in it, and then that row quietly gets an extra column. Let the csv module do the commas." },
    ],
  },
  {
    id: "file-errors",
    title: "When a file isn't there: FileNotFoundError",
    summary: "Catch FileNotFoundError with try/except, and keep going in a loop.",
    blocks: [
      { p: "Opening a file that doesn't exist raises **FileNotFoundError**. Like any error, you can catch it with `try` / `except`, and decide what happens instead of the program stopping." },
      { code: r`try:
    with open("treasure_map.txt") as f:
        print(f.read())
except FileNotFoundError:
    print("No map. We'll have to explore.")`, out: "No map. We'll have to explore." },
      { p: "Name the error you expect. A bare `except:` would also hide every other mistake, like a typo in a variable name, and you'd never find out about it." },
      { h: "else: when it worked" },
      { p: "Lines under `else:` run only when nothing went wrong in the `try`. Keep the `try` small, around the part that might fail:" },
      { code: r`with open("map.txt", "w") as f:
    f.write("X marks the spot\n")

try:
    with open("map.txt") as f:
        text = f.read()
except FileNotFoundError:
    print("No map.")
else:
    print("Found:", text.strip())`, out: "Found: X marks the spot" },
      { h: "Many files: try inside the loop" },
      { p: "When a loop opens several files, put the `try` **inside** the loop. Then a missing file only spoils its own round, and the loop carries on with the next name:" },
      { code: r`with open("north.txt", "w") as f:
    f.write("snow\n")

lost = []
for name in ["east.txt", "north.txt", "south.txt"]:
    try:
        with open(name) as f:
            f.read()
    except FileNotFoundError:
        lost.append(name)
print("Lost maps:", lost)`, out: "Lost maps: ['east.txt', 'south.txt']" },
      { p: "With the `try` around the whole loop instead, the first missing file jumps straight to the `except`, and the loop never comes back for the rest." },
      { tip: "Only the lines inside `try` are protected. If the `open` is outside it, the error still stops the program." },
    ],
  },
];
