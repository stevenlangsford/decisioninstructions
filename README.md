# minexp
minimal exp template (for heroku)

Things you need to do after cloning:

```npm install```

add ```.env``` and ```.gitignore```

one critical component of .env is your db credentials, for local testing with postgres this is a line of the form DATABASE_URL=postgres://name:pwd@localhost:port/username

If you're going to keep db login credentials here, it's probably also the place to to keep the cookie secret. Go to index.js and replace 'not_the_actual_secret' in the session setup with a reference to process.env.WHATEVERYOUCALLEDIT.

A reasonable default .gitignore might be:

```
# Node build artifacts
node_modules
npm-debug.log

# Local development
*.env
*.dev
.DS_Store
*RData
*.png
```
Assuming you have heroku and your database already set to go, at this point you should be ready to test locally with ```heroku local web```

If you want more structure than a monolithic "responses" table, there are three places you need to change, other that creating the table on the database itself so you can write to it. The $post at the save-point should direct to a new table-handler in index.js, and also dashboard (and index.js getter) will need a new button to download the new table as a csv. This would be a whole lot less ugly if I knew more about express.

Other than that, hopefully most edits will be directed at exp.js and admin.js.