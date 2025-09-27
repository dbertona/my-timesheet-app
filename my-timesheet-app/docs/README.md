# 📚 Documentación del Proyecto

## 🔧 Integración con N8N

Para gestionar workflows de n8n y evitar problemas de sincronización:

- **[Guía Completa de N8N](n8n-integration-guide.md)** - Documentación detallada con comandos, troubleshooting y mejores prácticas
- **Script de Utilidades**: `scripts/n8n-utils.sh` - Herramientas para gestionar n8n desde línea de comandos

### **Comandos Rápidos**

```bash
# Verificar estado
./scripts/n8n-utils.sh status

# Listar workflows
./scripts/n8n-utils.sh list

# Ver ayuda completa
./scripts/n8n-utils.sh help
```

## 📁 Estructura de Documentación

```
docs/
├── README.md                    # Este archivo
├── n8n-integration-guide.md    # Guía completa de N8N
└── patrones/
    └── celda-timesheet.md      # Patrones de UI
```

## 🚀 Inicio Rápido

1. **Verificar N8N**: `./scripts/n8n-utils.sh status`
2. **Listar Workflows**: `./scripts/n8n-utils.sh list`
3. **Gestionar Workflows**: Ver [Guía de N8N](n8n-integration-guide.md)

---

_Mantén esta documentación actualizada con cualquier cambio en el proyecto._
