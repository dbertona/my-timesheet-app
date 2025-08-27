pageextension 50914 "PS Dimension Value List" extends "Dimension Value List"
{
    var
        DepartamentoFun: Codeunit "PS_UserDepartmentManagement";
        UserDepartment: Code[10];
        JobRec: Record Job;
        grp: Integer;
        ApplyJobFilter: Codeunit "ApplyJobFilter";
        RecRef: RecordRef;
        EmptyRecRef: RecordRef; // Referencia de registro vacía
        FieldId: Integer;
        LineFieldId: Integer;
        JobTypeFilter: Enum "PS_JobTypeEnum";
        UserSetupRec: Record "User Setup"; // Agregar referencia a la tabla User Setup
        JobDeptRec: Record Job; // Registro para buscar proyectos por departamento
        JobCodes: Text; // Variable para almacenar los códigos de los proyectos

    trigger OnOpenPage()
    begin
        IF Rec."Global Dimension No." = 3 THEN BEGIN
            // Asegurarse de que JobRec y Rec están inicializados y abiertos
            grp := JobRec.FilterGroup;
            Rec.FilterGroup(10);
            UserDepartment := DepartamentoFun.PS_GetUserDepartment();
            if UserDepartment <> '' then begin
                // Buscar todos los proyectos que tengan el departamento del usuario
                JobDeptRec.SetRange(JobDeptRec."Global Dimension 1 Code", UserDepartment);
                if JobDeptRec.FindSet() then begin
                    JobCodes := '';
                    repeat
                        if JobCodes <> '' then
                            JobCodes := JobCodes + '|';
                        JobCodes := JobCodes + JobDeptRec."No.";
                    until JobDeptRec.Next() = 0;
                    // Aplicar el filtro de códigos de proyectos
                    Rec.SetFilter(Rec.Code, JobCodes);
                end else
                    Error('No se encontraron proyectos para el departamento del usuario.');
            end;
            JobRec.FilterGroup(grp);
            RecRef.GetTable(Rec); // Obtener la tabla en RecRef
            FieldId := 2; // ID del campo en la cabecera
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

            // Convertir el registro actual a RecordRef
            JobRec.FilterGroup(grp);
            RecRef.SetTable(Rec); // Establecer la tabla en RecRef
        END;
    end;
}
