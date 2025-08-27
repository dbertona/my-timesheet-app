codeunit 50416 "PS SharePoint Auth Call"
{
    procedure AuthenticateSharePoint(): Text;
    var
        SharePointAuthCode: Codeunit "PS SP Authorization Code"; // Llamamos al Codeunit de autenticación
        Token: Text;
        TenantId: Text;
        ClientId: Text;
        ClientSecret: Text;
        Scopes: List of [Text];
        AuthSuccess: Boolean;
    begin
        // Configurar datos de autenticación
        TenantId := 'a18dc497-a8b8-4740-b723-65362ab7a3fb';  // Tu Tenant ID
        ClientId := '7d991c3a-2aac-4609-afcb-1b2db79c5209';  // Coloca tu Client ID de Azure AD
        ClientSecret := '<REDACTED>';  // Coloca tu Client Secret de Azure AD

        // Añadir el alcance de SharePoint
        Scopes.Add('https://psgrupo365.sharepoint.com/.default');

        // Configurar los parámetros en el codeunit "SharePoint Authorization Code"
        SharePointAuthCode.SetParameters(TenantId, ClientId, ClientSecret, Scopes);

        // Intentar obtener el token usando una TryFunction
        AuthSuccess := false;  // Inicialmente falso
        if TryGetToken(SharePointAuthCode, Token) then
            AuthSuccess := true;

        if AuthSuccess then
            Message('Autenticación exitosa. Token: %1', Token)
        else
            Error('Error al obtener el token de autenticación.');

        // Devolver el token
        exit(Token);
    end;

    [TryFunction]
    local procedure TryGetToken(SharePointAuthCode: Codeunit "PS SP Authorization Code"; var Token: Text);
    begin
        // Llamar a la función para obtener el token
        Token := SharePointAuthCode.GetToken();
        // Si no hay error, la TryFunction retornará sin interrupciones
    end;
}
