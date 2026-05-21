import { useEffect, useState } from "react";
import { supabase } from "./supabase";

function App() {
  const [status, setStatus] = useState("Connecting to Supabase...");

  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase.from("applications").select("*");
      if (error) {
        setStatus("Connection failed: " + error.message);
      } else {
        setStatus("Connected to Supabase! Ready to build.");
      }
    }
    testConnection();
  }, []);

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>DNO Application Manager</h1>
      <p>{status}</p>
    </div>
  );
}

export default App;
