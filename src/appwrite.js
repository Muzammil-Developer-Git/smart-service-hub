
import { Client, Account, TablesDB, Teams } from "appwrite";

const client = new Client();

client
  .setEndpoint("https://sgp.cloud.appwrite.io/v1")
  .setProject("6aeb452f0013eb5c8b11");

export const account = new Account(client);
export const teams = new Teams(client);
export const tablesDB = new TablesDB(client);

export const DATABASE_ID = "smart_service_hub_db";
export const TABLE_ID = "customer_profiles";

export default client;