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
        grp: Integer;
        ApplyJobFilter: Codeunit "ApplyJobFilterLine";
        RecRef: RecordRef;
        LineRecRef: RecordRef;
        FieldId: Integer;
        LineFieldId: Integer;
        JobTypeFilter: Enum "PS_JobTypeEnum";

    trigger OnOpenPage()
    begin

        grp := JobRec.FilterGroup;
        Rec.FilterGroup(10);
        UserDepartment := DepartamentoFun.PS_GetUserDepartment();
        if UserDepartment <> '' then
            Rec.SetRange(Rec."Shortcut Dimension 1 Code", UserDepartment);
        JobRec.FilterGroup(grp);
        RecRef.GetTable(Rec); // Obtener la tabla en RecRef
        JobTypeFilter := JobTypeFilter::Todos;
        LineRecRef.GetTable(SalesInvLine);
        FieldId := 3; // Campo en la cabecera
        LineFieldId := 7180911; // ID del campo en la línea de la factura, cambiar por el campo correcto


        //ApplyJobFilter.ApplyFilter(RecRef, FieldId, JobTypeFilter, LineRecRef, LineFieldId);

        jobrec.FilterGroup(grp);
        RecRef.SetTable(Rec);
    end;
}
