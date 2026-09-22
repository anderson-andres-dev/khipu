import mysqlIcon from "devicon/icons/mysql/mysql-original.svg?url";
import mariaDbIcon from "devicon/icons/mariadb/mariadb-original.svg?url";
import postgresIcon from "devicon/icons/postgresql/postgresql-plain.svg?url";

export type ConnectionDriver = "mysql" | "mariadb" | "postgres";
export type BackendKind = "mysql" | "postgres";

export interface DriverDefinition {
  id: ConnectionDriver;
  name: string;
  icon: string;
  defaultPort: number;
  backendKind: BackendKind;
}

export const connectionDrivers: DriverDefinition[] = [
  {
    id: "mysql",
    name: "MySQL",
    icon: mysqlIcon,
    defaultPort: 3306,
    backendKind: "mysql",
  },
  {
    id: "mariadb",
    name: "MariaDB",
    icon: mariaDbIcon,
    defaultPort: 3306,
    backendKind: "mysql",
  },
  {
    id: "postgres",
    name: "PostgreSQL",
    icon: postgresIcon,
    defaultPort: 5432,
    backendKind: "postgres",
  },
];

export function getDriver(driver: ConnectionDriver): DriverDefinition {
  return connectionDrivers.find((candidate) => candidate.id === driver) ?? connectionDrivers[0];
}
