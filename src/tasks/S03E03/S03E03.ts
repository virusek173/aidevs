import axios from "axios";
import { Central } from "../../common/central.js";
import { OpenAi } from "../../common/openai.js";
import dotenv from "dotenv";
import { DatabaseService } from "../../common/database.js";

const central = new Central("database");
const openaiService = new OpenAi("You are expert in SQL");
const database = new DatabaseService("database");

interface CreateTableReply {
  "Create Table": string;
}

const main = async () => {
  const datacentersTable = await database.execute(
    "show create table datacenters"
  );
  const usersTable = await database.execute("show create table users");

  const datacentersCreateTable = datacentersTable?.reply?.[0]?.["Create Table"];
  const usersCreateTable = usersTable?.reply?.[0]?.["Create Table"];

  const result =
    await openaiService.interact(`I need to get all IDS of datacenters with is_active=true and that related entry in users table has 
        is_active=false. Please give me propper sql command based on tables: ${datacentersCreateTable} and ${usersCreateTable}`);

  console.log({ result });

  const answer = JSON.parse(result ?? "").answer;

  const userIdsResponse = await database.execute(answer);
  const userIds = userIdsResponse?.reply?.map(
    (obj: any) => Object.values(obj)[0]
  );
  console.log({ userIds, userIdsResponse });

  const centralResult = await central.verify(userIds);
  console.info(centralResult);
};

main();
