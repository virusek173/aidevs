import { DatabaseService } from "../../common/database.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { OpenAi } from "../../common/openai.js";
import { Central } from "../../common/central.js";

const database = new DatabaseService("database");
const openai = new OpenAi('You are expert in Cypher, you help building the right commands for neo4j database')
const central = new Central('connections');

// Get the directory name from the module URL
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const main = async () => {
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }

    // Define file paths
    const usersFilePath = path.join(dataDir, 'users.json');
    const connectionsFilePath = path.join(dataDir, 'connections.json');
    const cypherFilePath = path.join(dataDir, 'cypher.txt');

    // Check if users data exists
    let users;
    if (fs.existsSync(usersFilePath)) {
        users = JSON.parse(fs.readFileSync(usersFilePath, 'utf-8'));
    } else {
        // Fetch all entries from the users table
        users = await database.execute("SELECT * FROM users");
        // Save users to a JSON file if it doesn't exist
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    }
    console.log(users);

    // Check if connections data exists
    let connections;
    if (fs.existsSync(connectionsFilePath)) {
        connections = JSON.parse(fs.readFileSync(connectionsFilePath, 'utf-8'));
    } else {
        // Fetch all entries from the connections table
        connections = await database.execute("SELECT * FROM connections");
        console.log(connections);
        // Save connections to a JSON file if it doesn't exist
        fs.writeFileSync(connectionsFilePath, JSON.stringify(connections, null, 2));
    }
    console.log(connections);

    // const prompt = `I am providing you data: users and connections. 
    //     user contains name and id.
    //     connections contains links between users by id. 
    //     Build query in Cypher language to create users as nodes 
    //     and connections as links beetween based on data.
    //     Respond only with Cypher language that I can copy to Neo4j.
    //     users: ${JSON.stringify(users)} connections: ${JSON.stringify(connections)}
    //     Do not attach white characters.`;
        
    // const openaiRespond = await openai.interact(prompt);

    // const answerJson = JSON.parse(openaiRespond || '').answer


    // console.log({ answerJson });
    // fs.writeFileSync(cypherFilePath, JSON.stringify(answerJson, null, 2));

    const response = await central.verify('Barbara, Aleksander, Azazel, Rafał'.split(', ').reverse().join(', '))
    console.log({ response });
}

main();