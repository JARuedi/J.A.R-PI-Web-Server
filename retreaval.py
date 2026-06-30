import pandas as pd
import mysql.connector
import os

def update_spreadsheet():
    try:
        conn = mysql.connector.connect(
            host=os.getenv('DB_HOST', '127.0.0.1'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD'),
            database=os.getenv('DB_NAME', 'digital_planner')
        )

        query = "SELECT email, join_date, join_time FROM users"
        df = pd.read_sql(query, conn)

        # Format the date and time columns to be readable strings
        if not df.empty:
            df['join_date'] = pd.to_datetime(df['join_date']).dt.strftime('%Y-%m-%d')
            # Converting timedelta to a readable HH:MM:SS string
            df['join_time'] = df['join_time'].astype(str).str.split().str[-1]

        df.to_excel('dp_spread_sheet.ods', engine='odf', index=False)

        print("Spreadsheet updated successfully with formatted dates!")
        conn.close()
    except Exception as error:
        print(f"Error updating spreadsheet: {error}")

if __name__ == "__main__":
    update_spreadsheet()
