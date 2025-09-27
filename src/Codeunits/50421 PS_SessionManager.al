codeunit 50421 "PS_SessionManager"
{
    SingleInstance = true;

    var
        IsInitialized: Boolean;

    procedure SetInitialized(Value: Boolean)
    begin
        IsInitialized := Value;
    end;

    procedure GetInitialized(): Boolean
    begin
        exit(IsInitialized);
    end;
}
