pageextension 50913 "PS Customer Ledger Entries" extends "Customer Ledger Entries"
{
    var
        DepartamentoFun: Codeunit "PS_UserDepartmentManagement";
        UserDepartment: Code[10];
        JobRec: Record Job;
        SalesInvLine: Record "Sales Invoice Line";
        grp: Integer;
        ApplyJobFilterLine: Codeunit "PS_ApplyJobFilterLine";
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
        FieldId := 6; // Campo en la cabecera
        LineFieldId := 3; // ID del campo en la línea de la factura, cambiar por el campo correcto
        JobTypeFilter := JobTypeFilter::Todos;
        SearchFieldRef1 := 7180911;
        SearchFieldRef2 := 29;
        AdditionalSearchFieldRef1 := 7180960;
        AdditionalSearchFieldRef2 := 40;

        // Llamar al procedimiento ApplyFilter del nuevo codeunit ApplyJobFilterLine
        ApplyJobFilterLine.ApplyFilter(RecRef, FieldId, SearchFieldRef1, SearchFieldRef2, JobTypeFilter, LineRecRef, LineFieldId, AdditionalSearchFieldRef1, AdditionalSearchFieldRef2);

        JobRec.FilterGroup(grp);
        RecRef.SetTable(Rec);
    end;
}
