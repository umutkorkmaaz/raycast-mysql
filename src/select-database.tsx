import { List, LocalStorage, ActionPanel, Action } from "@raycast/api";
import { useEffect, useState } from "react";
import mysql from 'mysql2';
import ShowTable from "./show-table";

interface MySQLCredentials {
    username: string;
    password: string;
}

interface SelectDatabaseProps {
    database: string;
}


export default function SelectDatabase({ database }: SelectDatabaseProps) {
    const [tables, setTables] = useState<string[]>([]);
    const [credentials, setCredentials] = useState<MySQLCredentials | null>(null);
    const [selectedTable, setSelectedTable] = useState<string | null>(null);

    useEffect(() => {
        const fetchCredentials = async () => {
            const storedCredentials = await LocalStorage.getItem<string>("mysql-credentials");
            if (storedCredentials) {
                setCredentials(JSON.parse(storedCredentials));
            }
        };
        fetchCredentials();
    }, []);

    useEffect(() => {
        if (credentials) {
            const listTables = async () => {
                try {
                    const connection = mysql.createConnection({
                        host: 'localhost',
                        user: credentials.username,
                        password: credentials.password
                    });
                    connection.connect();
                    connection.query(`USE ${database}`);
                    connection.query('SHOW TABLES', function (error: mysql.QueryError, results: mysql.RowDataPacket[] | mysql.FieldPacket[] | mysql.ResultSetHeader) {
                        if (error) throw error;
                        const key = 'Tables_in_' + database;
                        const tables = (results as mysql.RowDataPacket[]).map((result: mysql.RowDataPacket) => result[key] as string);
                        setTables(tables);
                    });
                    connection.end();
                } catch (e) {
                    console.error(e);
                }
            };
            listTables();
        }
    }, [credentials]);

    if (selectedTable) {
        return <ShowTable database={database} table={selectedTable} />
    }
    return (
        <List
            isLoading={tables.length === 0}
            searchBarPlaceholder="Filter databases by name..."
            throttle={true}
            navigationTitle="Databases"
        >
            {tables.map((table) => (
                <List.Item
                    key={table}
                    title={table}
                    actions={
                        <ActionPanel>
                            <Action
                                title="Open"
                                onAction={() => {
                                    setSelectedTable(table);
                                }}
                            />
                        </ActionPanel>
                    }
                />
            ))}
        </List>
    )
}
