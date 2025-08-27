// ------------------------------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.
// ------------------------------------------------------------------------------------------------
codeunit 50418 "PS SP Authorization Code" implements "SharePoint Authorization"
{
    InherentEntitlements = X;
    InherentPermissions = X;

    var

        ClientId: Text;

        ClientSecret: Text;

        AuthCodeErr: Text;

        EntraTenantId: Text;

        Scopes: List of [Text];
        AuthorityTxt: Label 'https://login.microsoftonline.com/a18dc497-a8b8-4740-b723-65362ab7a3fb/oauth2/v2.0/authorize';
        BearerTxt: Label 'Bearer %1', Comment = '%1 - Token', Locked = true;

    [NonDebuggable]
    procedure SetParameters(NewEntraTenantId: Text; NewClientId: Text; NewClientSecret: Text; NewScopes: List of [Text])
    begin
        EntraTenantId := NewEntraTenantId;
        ClientId := NewClientId;
        ClientSecret := NewClientSecret;
        Scopes := NewScopes;
    end;

    [NonDebuggable]
    procedure Authorize(var HttpRequestMessage: HttpRequestMessage);
    var
        Headers: HttpHeaders;
    begin
        HttpRequestMessage.GetHeaders(Headers);
        Headers.Add('Authorization', StrSubstNo(BearerTxt, GetToken()));
    end;

    [NonDebuggable]
    procedure GetToken(): Text
    var
        ErrorText: Text;

        AccessToken: Text;
    begin
        if not AcquireToken(AccessToken, ErrorText) then
            Error(ErrorText);
        exit(AccessToken);
    end;

    [NonDebuggable]
    local procedure AcquireToken(var AccessToken: Text; var ErrorText: Text): Boolean
    var
        OAuth2: Codeunit OAuth2;
        IsHandled, IsSuccess : Boolean;
    begin
        OnBeforeGetToken(IsHandled, IsSuccess, ErrorText, AccessToken);
        Message(StrSubstNo(AuthorityTxt));
        if not IsHandled then begin

            if (not OAuth2.AcquireAuthorizationCodeTokenFromCache(ClientId, ClientSecret, '', StrSubstNo(AuthorityTxt, EntraTenantId), Scopes, AccessToken)) or (AccessToken = '') then
                OAuth2.AcquireTokenByAuthorizationCode(ClientId, ClientSecret, StrSubstNo(AuthorityTxt, EntraTenantId), '', Scopes, "Prompt Interaction"::None, AccessToken, AuthCodeErr);

            IsSuccess := AccessToken <> '';

            if AuthCodeErr <> '' then
                ErrorText := AuthCodeErr
            else
                ErrorText := GetLastErrorText();
        end;

        exit(IsSuccess);
    end;

    [InternalEvent(false, true)]
    local procedure OnBeforeGetToken(var IsHandled: Boolean; var IsSuccess: Boolean; var ErrorText: Text; var AccessToken: Text)
    begin
    end;
}
