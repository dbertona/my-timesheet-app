# Configuración de Microsoft 365 para n8n (Microsoft Graph)

## Configuración del Nodo Microsoft Outlook

### Credenciales Microsoft Graph para n8n

**El workflow ahora usa Microsoft Graph en lugar de SMTP**, lo que es más seguro y moderno.

**Parámetros de la credencial:**
- **Tipo**: Microsoft Graph Security API
- **Nombre**: "Microsoft Graph Security account"
- **Cuenta**: `noreply@powersolution.es`

### Crear Contraseña de Aplicación

1. **Acceder al portal de Microsoft 365**
   - Ir a https://admin.microsoft.com
   - Iniciar sesión con cuenta de administrador

2. **Habilitar autenticación moderna** (si no está habilitada)
   - Admin Center → Configuración → Org settings → Modern authentication
   - Activar "Modern authentication"

3. **Crear contraseña de aplicación para noreply@powersolution.es**
   - Ir a https://mysignins.microsoft.com/security-info
   - Agregar método de verificación → "App password"
   - Generar nueva contraseña de aplicación
   - Copiar la contraseña generada (16 caracteres)

### Configuración en n8n (Microsoft Graph)

1. **Ir a Credentials en n8n**
2. **Usar la credencial existente**: "Microsoft Graph Security account"
3. **Verificar permisos**: La cuenta debe tener permisos para enviar emails

### Configuración del Nodo Microsoft Outlook

**Parámetros del nodo:**
- **Resource**: `message`
- **Operation**: `send`
- **From**: `noreply@powersolution.es`
- **To**: Dinámico (tomado del payload)
- **Body**: HTML generado automáticamente

### Verificación de Configuración

**Probar configuración:**
1. Ejecutar workflow manualmente
2. Verificar que los emails llegan correctamente
3. Revisar logs de n8n para respuestas HTTP 202 (éxito)

### Troubleshooting Común (Microsoft Graph)

**Error: "Insufficient privileges"**
- Verificar que la cuenta tiene permisos de envío de email
- Confirmar permisos de aplicación en Azure AD

**Error: "Resource not found"**
- Verificar que la cuenta `noreply@powersolution.es` existe
- Confirmar que está habilitada para enviar emails

**Error: "Access denied"**
- Verificar configuración de permisos de la aplicación
- Confirmar que el tenant permite envío de emails via Graph API

### Configuración Adicional en Microsoft 365

**Habilitar envío automático:**
1. Admin Center → Exchange admin center
2. Mail flow → Connectors
3. Verificar que hay conectores SMTP configurados

**Configurar límites de envío:**
- Microsoft 365 permite hasta 10,000 emails por día
- Límite por mensaje: 1,500 destinatarios

### Manejo de Dominios Variables

**Los destinatarios pueden tener diferentes dominios:**
- El workflow acepta cualquier dominio de email válido
- No está limitado a `@powersolution.es`
- La validación de formato email permite cualquier dominio

**Payload Esperado (con dominios variables):**
```json
{
  "header_id": "uuid-del-timesheet",
  "requester_email": "usuario@cualquier-dominio.com",
  "approver_codes": ["REC0001"],
  "recipients": [
    "responsable@powersolution.es",
    "gerente@empresa-externa.com",
    "coordinador@otro-dominio.org"
  ],
  "env": "testing|production"
}
```

### Seguridad

- **No usar contraseña normal**: Siempre usar contraseñas de aplicación
- **Rotar contraseñas**: Cambiar cada 6-12 meses
- **Monitorear actividad**: Revisar logs de envío regularmente
