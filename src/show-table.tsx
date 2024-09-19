import { LocalStorage, Detail } from "@raycast/api";
import { useEffect, useState } from "react";
import mysql from 'mysql2';
import { markdownTable } from 'markdown-table'


interface MySQLCredentials {
    username: string;
    password: string;
}

interface ShowTableProps {
    database: string;
    table: string;
}


export default function ShowTable({ database, table }: ShowTableProps) {
    const [top1000, setTop1000] = useState<string[][]>([]);
    const [credentials, setCredentials] = useState<MySQLCredentials | null>(null);

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
                    connection.query(`SELECT * FROM ${table} LIMIT 0,10`, function (error: mysql.QueryError, results: mysql.RowDataPacket[] | mysql.FieldPacket[] | mysql.ResultSetHeader) {
                        if (error) throw error;
                        //get keys as header
                        const keys = Object.keys((results as mysql.RowDataPacket[])[0]);
                        const rows = (results as mysql.RowDataPacket[]).map((result: mysql.RowDataPacket) => keys.map(key => result[key]));
                        setTop1000([keys, ...rows]);

                    });
                    connection.end();
                } catch (e) {
                    console.error(e);
                }
            };
            listTables();
        }
    }, [credentials]);


    const toMarkdown = (data: string[][]) => {
        return markdownTable(data);
    }


    return (
        <Detail
            markdown={toMarkdown(top1000)}
        />
    )
}
