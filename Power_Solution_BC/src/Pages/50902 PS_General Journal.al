/// <summary>
/// PageExtension PS_OperativeJobLis (ID 50001) extends Record ARBVRNOperativeJobList.
/// </summary>
pageextension 50902 PS_General_Journal extends "General Journal"
{
    actions
    {
        addfirst("F&unctions")
        {
            action(ImportForExcel)
            {
                ApplicationArea = All;
                Caption = 'Import Payroll from Excel.';
                Image = ExportToExcel;
                ToolTip = 'Import Payroll from Excel.';
                trigger OnAction()
                begin
                    PS_ImportarNominas.UploadAttachment();
                end;
            }
        }
    }
    var
        PS_ImportarNominas: Codeunit 50402;
}
