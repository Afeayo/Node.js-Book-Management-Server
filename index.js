const http = require('http');
const fs = require('fs');
const path = require('path');

const bookDataBase = path.join(__dirname, "dataBase", 'bookDb.json');
const HOSTName = 'localhost';
const PORT = 11000;

function requestHandler(req, res) {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        res.writeHead(401);
        res.end('Authorization header is missing');
        return;
    }

    const encodedCredentials = authHeader.split(' ')[1];
    const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString('utf-8');
    const [username, password] = decodedCredentials.split(':');

    
    if (username === 'admin' && password === 'password') {
        // when an Authentication is success
        if (req.url.startsWith('/books')) {
            handleBooks(req, res);
        } else {
            console.log('Invalid endpoint');
            res.writeHead(404);
            res.end('Invalid endpoint');
        }
    } else {
        // when an Authentication failed
        res.writeHead(401);
        res.end('Invalid username or password');
    }
}

function handleBooks(req, res) {
    console.log('Handling books request:', req.method, req.url);

    const urlWithoutQuery = req.url.split('?')[0]; 
    console.log('URL without query:', urlWithoutQuery);

    if (req.method === 'GET') {
        if (urlWithoutQuery === '/books') {
            console.log('GET /books request');
            getBooks(req, res);
        } else if (urlWithoutQuery.startsWith('/books/') && req.method === 'GET') {
            console.log('GET /books/:id request');
            getBookById(req, res);
        } else {
            console.log('Invalid endpoint for books');
            res.writeHead(404);
            res.end('Invalid endpoint for books');
        }
    } else if (req.method === 'POST' && urlWithoutQuery === '/books') {
        console.log('POST /books request');
        postBook(req, res);
    } else if (req.method === 'PUT' && urlWithoutQuery.startsWith('/books/')) {
        console.log('PUT /books/:id request');
        putBook(req, res);
    } else if (req.method === 'PATCH' && urlWithoutQuery.startsWith('/books/')) {
        console.log('PATCH /books/:id request');
        patchBook(req, res);
    } else if (req.method === 'DELETE' && urlWithoutQuery.startsWith('/books/')) {
        console.log('DELETE /books/:id request');
        deleteBook(req, res);
    } else {
        console.log('Invalid endpoint for books');
        res.writeHead(404);
        res.end('Invalid endpoint for books');
    }
}

function getBooks(req, res) {
    const urlParts = req.url.split('/');
    const bookId = urlParts[2]; 

    if (bookId) {
        
        fs.readFile(bookDataBase, "utf8", (err, data) => {
            if (err) {
                console.log(err);
                res.writeHead(400);
                res.end("An error occurred");
                return;
            }
            
            const books = JSON.parse(data);
            const book = books.find(book => book.id === bookId);

            if (!book) {
                res.writeHead(404);
                res.end("Book not found");
                return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(book));
        });
    } else {
        
        fs.readFile(bookDataBase, "utf8", (err, data) => {
            if (err) {
                console.log(err);
                res.writeHead(400);
                res.end("An error occurred");
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
        });
    }
}

function postBook(req, res) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        res.writeHead(401);
        res.end('Authorization header is missing');
        return;
    }

    const body = [];

    req.on("data", (chunk) => {
        body.push(chunk);
    });

    req.on("end", () => {
        const parsedBook = Buffer.concat(body).toString();
        const newBook = JSON.parse(parsedBook);
        const newId = generateUniqueId();
        newBook.id = newId;

        fs.readFile(bookDataBase, "utf8", (err, data) => {
            if (err) {
                console.log(err);
                res.writeHead(400);
                res.end("An error occurred");
                return;
            }

            const oldBooks = JSON.parse(data);
            const allBooks = [...oldBooks, newBook];

            fs.writeFile(bookDataBase, JSON.stringify(allBooks), (err) => {
                if (err) {
                    console.log(err);
                    res.writeHead(500);
                    res.end(JSON.stringify({
                        message: 'Internal Server Error. Could not save book to database.'
                    }));
                    return;
                }

                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(newBook));
            });
        });
    });
}

function putBook(req, res) {
        const authHeader = req.headers['authorization'];
    
        if (!authHeader) {
            res.writeHead(401);
            res.end('Authorization header is missing');
            return;
        }
    
        const urlParts = req.url.split('/');
        const bookId = urlParts[2]; 
    
        let body = [];
    
        req.on("data", (chunk) => {
            body.push(chunk);
        });
    
        req.on("end", () => {
            body = Buffer.concat(body).toString();
    
            fs.readFile(bookDataBase, "utf8", (err, data) => {
                if (err) {
                    console.log(err);
                    res.writeHead(400);
                    res.end("An error occurred");
                    return;
                }
    
                let books = JSON.parse(data);
                const index = books.findIndex(book => book.id === bookId);
    
                if (index === -1) {
                    res.writeHead(404);
                    res.end("Book not found");
                    return;
                }
    
                const updatedBook = JSON.parse(body);
                updatedBook.id = bookId;
    
                books[index] = updatedBook;
    
                fs.writeFile(bookDataBase, JSON.stringify(books), (err) => {
                    if (err) {
                        console.log(err);
                        res.writeHead(500);
                        res.end(JSON.stringify({
                            message: 'Internal Server Error. Could not update book in the database.'
                        }));
                        return;
                    }
    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(updatedBook));
                });
            });
        });
    }

function patchBook(req, res) {
        const authHeader = req.headers['authorization'];
    
        if (!authHeader) {
            res.writeHead(401);
            res.end('Authorization header is missing');
            return;
        }
    
        const urlParts = req.url.split('/');
        const bookId = urlParts[2]; 
    
        let body = [];
    
        req.on("data", (chunk) => {
            body.push(chunk);
        });
    
        req.on("end", () => {
            body = Buffer.concat(body).toString();
    
            fs.readFile(bookDataBase, "utf8", (err, data) => {
                if (err) {
                    console.log(err);
                    res.writeHead(400);
                    res.end("An error occurred");
                    return;
                }
    
                let books = JSON.parse(data);
                const index = books.findIndex(book => book.id === bookId);
    
                if (index === -1) {
                    res.writeHead(404);
                    res.end("Book not found");
                    return;
                }
    
                const updatedFields = JSON.parse(body);
                Object.assign(books[index], updatedFields);
    
                fs.writeFile(bookDataBase, JSON.stringify(books), (err) => {
                    if (err) {
                        console.log(err);
                        res.writeHead(500);
                        res.end(JSON.stringify({
                            message: 'Internal Server Error. Could not update book in the database.'
                        }));
                        return;
                    }
    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(books[index]));
                });
            });
        });
    }
    


    function deleteBook(req, res) {
        const authHeader = req.headers['authorization'];
    
        if (!authHeader) {
            res.writeHead(401);
            res.end('Authorization header is missing');
            return;
        }
    
        const urlParts = req.url.split('/');
        const bookId = urlParts[2]; 
    
        fs.readFile(bookDataBase, "utf8", (err, data) => {
            if (err) {
                console.log(err);
                res.writeHead(400);
                res.end("An error occurred");
                return;
            }
    
            let books = JSON.parse(data);
            const index = books.findIndex(book => book.id === bookId);
    
            if (index === -1) {
                res.writeHead(404);
                res.end("Book not found");
                return;
            }
    
            const deletedBook = books.splice(index, 1)[0];
    
            fs.writeFile(bookDataBase, JSON.stringify(books), (err) => {
                if (err) {
                    console.log(err);
                    res.writeHead(500);
                    res.end(JSON.stringify({
                        message: 'Internal Server Error. Could not delete book from the database.'
                    }));
                    return;
                }
    
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    message: `The Book with ID: ${deletedBook.id} with the the Title :  ${deletedBook.title} was successfully deleted.`
                }));
            });
        });
    }
    
function getBookById(req, res) {
    const urlParts = req.url.split('/');
    const bookId = urlParts[2]; 

    fs.readFile(bookDataBase, "utf8", (err, data) => {
        if (err) {
            console.log(err);
            res.writeHead(400);
            res.end("An error occurred");
            return;
        }
        
        const books = JSON.parse(data);
        const book = books.find(book => book.id === bookId);

        if (!book) {
            res.writeHead(404);
            res.end("Book not found");
            return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(book));
    });
}

function generateUniqueId() {
    return Math.random().toString(36).substr(2, 9); 
}

const server = http.createServer(requestHandler);
server.listen(PORT, HOSTName, () => {
    console.log(`Server listening @ ${HOSTName}:${PORT}`);
});
