/// <summary>
/// Codeunit UserDepartmentManagement (ID 50000).
/// </summary>

codeunit 50400 "PS_UserDepartmentManagement"
{
    var
        UserDepartment: Code[10];

    /// <summary>
    /// GetUserDepartment.
    /// </summary>
    /// <returns>Return value of type Code[10].</returns>
    procedure PS_GetUserDepartment(): Code[10]
    var
        ResponsibilityCenterRec: Record "Responsibility Center";
        ConfiguracionUsuariosRec: Record "User Setup";
        User: Record User;


    begin

        User.SetRange("User Security ID", UserSecurityId());
        User.FindFirst();
        if not User.FindFirst() then
            EXIT;
        ConfiguracionUsuariosRec.SetRange(ConfiguracionUsuariosRec."User Id", UserID);
        IF not ConfiguracionUsuariosRec.FindSET() THEN EXIT;
        ConfiguracionUsuariosRec.FindFirst();
        if not ConfiguracionUsuariosRec.FindFirst() then
            EXIT;
        IF ConfiguracionUsuariosRec."ARBVRNJobresponsabilityfilter" <> '' then begin
            ResponsibilityCenterRec.SetRange(ResponsibilityCenterRec."Code", ConfiguracionUsuariosRec."ARBVRNJobresponsabilityfilter");
            ResponsibilityCenterRec.FindFirst();
            if ResponsibilityCenterRec.FindFirst() then begin
                UserDepartment := ResponsibilityCenterRec."Global Dimension 1 Code";
                exit(UserDepartment)
            end
        end
    end;

}
