/// <summary>
/// PageExtension PS_OperativeJobLis (ID 50001) extends Record ARBVRNOperativeJobList.
/// </summary>
pageextension 50903 PS_JobList extends "Job List"
{
    layout
    {
        addafter(Status)
        {
            field("% probability"; Rec."PS_% probability")
            {
                ApplicationArea = Jobs;
                ToolTip = 'Specifies the % probability for the project';
                Visible = IsInitialized;
            }
        }
    }
    var
        IsInitialized: Boolean;

    trigger OnOpenPage()
    var
        DepartamentoFun: Codeunit "PS_UserDepartmentManagement";
        UserDepartment: Code[10];
        JobRec: Record Job;
        grp: Integer;
        ApplyJobFilter: Codeunit "PS_ApplyJobFilter";
        RecRef: RecordRef;
        EmptyRecRef: RecordRef; // Referencia de registro vacía
        FieldId: Integer;
        LineFieldId: Integer;
        JobTypeFilter: Enum "PS_JobTypeEnum";
        UserSetupRec: Record "User Setup"; // Agregar referencia a la tabla User Setup
    begin
        // Asegurarse de que JobRec y Rec están inicializados y abiertos
        IsInitialized := False;
        grp := JobRec.FilterGroup;
        Rec.FilterGroup(10);
        UserDepartment := DepartamentoFun.PS_GetUserDepartment();
        if UserDepartment <> '' then
            Rec.SetRange(Rec."Global Dimension 1 Code", UserDepartment);
        JobRec.FilterGroup(grp);
        RecRef.GetTable(Rec); // Obtener la tabla en RecRef
        FieldId := 1; // ID del campo en la cabecera
        JobTypeFilter := JobTypeFilter::Todos;

        // Configurar la referencia de registro vacía
        EmptyRecRef.GetTable(Rec);
        EmptyRecRef.Reset(); // Asegurar que esté vacía
        LineFieldId := 0; // ID de campo no relevante para la referencia vacía

        // Leer el registro de User Setup del usuario actual
        if UserSetupRec.Get(UserId()) then begin
            // Llamar al procedimiento ApplyFilter solo si "Project team filter" es verdadero
            if UserSetupRec."Project team filter" then
                ApplyJobFilter.ApplyFilter(RecRef, FieldId, JobTypeFilter, EmptyRecRef, LineFieldId);
        end else
            Error('No se encontró la configuración del usuario.');
        RecRef.SetTable(Rec); // Establecer la tabla en RecRef
        Rec.FilterGroup(0);
        Rec.SetFilter(Status, 'Open');
        Rec.SetAscending("No.", True);
    end;
}


