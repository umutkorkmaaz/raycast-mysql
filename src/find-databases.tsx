import React, { useState, useEffect } from 'react';
import mysql from 'mysql2';
import { LocalStorage, Form, ActionPanel, Action, List } from '@raycast/api';
import { useForm } from '@raycast/utils'
import SelectDatabase from './select-database';

interface MySQLCredentials {
  username: string;
  password: string;
}

export default function Command() {
  const [credentials, setCredentials] = useState<MySQLCredentials | null>(null);
  const [databases, setDatabases] = useState<string[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);


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
      const listDatabases = async () => {
        try {
          const connection = mysql.createConnection({
            host: 'localhost',
            user: credentials.username,
            password: credentials.password
          });
          connection.connect();
          connection.query('SHOW DATABASES', function (error: mysql.QueryError, results: mysql.RowDataPacket[] | mysql.FieldPacket[] | mysql.ResultSetHeader) {
            if (error) throw error;
            const databases = (results as mysql.RowDataPacket[]).map((result: mysql.RowDataPacket) => result.Database as string);
            setDatabases(databases);
          });
          connection.end();
        } catch (e) {
          console.error(e);
        }
      };
      listDatabases();
    }
  }, [credentials]);

  const { handleSubmit, itemProps } = useForm<MySQLCredentials>({
    async onSubmit(values: MySQLCredentials) {
      await LocalStorage.setItem("mysql-credentials", JSON.stringify(values));
      setCredentials(values);
    }
  });

  if (!credentials) {
    return (
      <Form actions={
        <ActionPanel>
          <Action.SubmitForm title="Save" onSubmit={handleSubmit} />
        </ActionPanel>
      }>
        <Form.TextField title="Username" {...itemProps.username} />
        <Form.PasswordField title="Password" {...itemProps.password} />
      </Form>
    );
  }

  if (selectedDatabase) {
    return <SelectDatabase database={selectedDatabase} />;
  }

  return (
    <List>
      {databases.map((database) => (
        <List.Item
          key={database}
          title={database}
          actions={
            <ActionPanel>
              <Action
                title="Open"
                onAction={() => setSelectedDatabase(database)}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}