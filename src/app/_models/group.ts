export interface Group {
    name: string;
    connection: Connection[];
}

export interface Connection {
    connectionId: string;
    username: string;
}