/// <summary>
/// PageExtension PS_OperativeJobLis (ID 50001) extends Record ARBVRNOperativeJobList.
/// </summary>
pageextension 50907 PS_Sales_Invoice_List extends "Sales Invoice List"
{
    var
        DepartamentoFun: Codeunit "PS_UserDepartmentManagement";
        UserDepartment: Code[10];
        JobRec: Record Job;
        SalesInvLine: Record "Sales Invoice Line";
        UserSetupRec: Record "User Setup";
        grp: Integer;
        ApplyJobFilter: Codeunit "PS_ApplyJobFilter";
        RecRef: RecordRef;
        LineRecRef: RecordRef;
        FieldId: Integer;
        LineFieldId: Integer;
        JobTypeFilter: Enum "PS_JobTypeEnum";
        SearchFieldRef1: Integer;
        SearchFieldRef2: Integer;
        AdditionalSearchFieldRef1: Integer;
        AdditionalSearchFieldRef2: Integer;

    trigger OnOpenPage()
    begin
        grp := JobRec.FilterGroup;
        Rec.FilterGroup(10);
        JobRec.FilterGroup(grp);
        RecRef.GetTable(Rec);
        LineRecRef.GetTable(SalesInvLine);
        FieldId := 3; // Campo en la cabecera
        LineFieldId := 3; // ID del campo en la línea de la factura, cambiar por el campo correcto
        JobTypeFilter := JobTypeFilter::Todos;
        SearchFieldRef1 := 7180911;
        SearchFieldRef2 := 29;
        AdditionalSearchFieldRef1 := 7180960;
        AdditionalSearchFieldRef2 := 40;

        // Llamar al procedimiento ApplyFilter solo si "Project team filter" es verdadero en User Setup
        if UserSetupRec.Get(UserId()) then
            if UserSetupRec."Project team filter" then
                ApplyJobFilter.ApplyFilter(RecRef, FieldId, JobTypeFilter, LineRecRef, LineFieldId);

        JobRec.FilterGroup(grp);
        RecRef.SetTable(Rec);
    end;
}
