import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde dist
app.use(express.static(path.join(__dirname, "dist")));

// Endpoint para obtener la fecha del servidor
app.get("/api/server-date", (req, res) => {
  try {
    const serverDate = new Date();
    res.json({
      date: serverDate.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: serverDate.getTime(),
    });
  } catch (error) {
    console.error("Error obteniendo fecha del servidor:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Endpoint para factorial (placeholder)
app.post("/api/factorial/vacations", (req, res) => {
  try {
    const { userEmail, startDate, endDate } = req.body;

    // Por ahora devolver array vacío hasta implementar la integración real
    console.log(
      `Factorial request: ${userEmail} from ${startDate} to ${endDate}`
    );

    res.json([]);
  } catch (error) {
    console.error("Error en factorial API:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Fallback para SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
  console.log(`Fecha del servidor: ${new Date().toISOString()}`);
});
