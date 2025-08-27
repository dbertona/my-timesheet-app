page 50151 "PS Internal Procedure"
{
    PageType = Card;
    ApplicationArea = All;
    UsageCategory = Administration;
    Caption = 'PS Internal Procedure';

    actions
    {
        area(Processing)
        {
            action(PS_HistorialPlannig)
            {
                Caption = 'Historial Plannig';
                ApplicationArea = All;
                Image = Process;
                trigger OnAction()
                begin
                    Codeunit.Run(Codeunit::"PS_HistorialPlannig");
                end;
            }
            action(PS_ProcessAdjustment)
            {
                Caption = 'Process Adjustment';
                ApplicationArea = All;
                Image = Process;
                trigger OnAction()
                begin
                    Codeunit.Run(Codeunit::"PS_ProcessAdjustment");
                end;
            }
            action(PS_HistoricoPlanificacion)
            {
                Caption = 'Historico Planificacion';
                ApplicationArea = All;
                Image = Process;
                trigger OnAction()
                begin
                    Codeunit.Run(Codeunit::"PS_Historico Planificacion");
                end;
            }
            action(PS_UserDepartmentManagement)
            {
                Caption = 'User Department Management';
                ApplicationArea = All;
                Image = Process;
                trigger OnAction()
                begin
                    Codeunit.Run(Codeunit::"PS_UserDepartmentManagement");
                end;
            }
            action(PS_Calculate_Statistics)
            {
                Caption = 'Calculate Statistics';
                ApplicationArea = All;
                Image = Calculate;
                trigger OnAction()
                begin
                    Codeunit.Run(Codeunit::"PS Calculate Statistics");
                end;
            }
            action(PS_ImportarNominas)
            {
                Caption = 'Importar Nominas';
                ApplicationArea = All;
                Image = Import;
                trigger OnAction()
                begin
                    Codeunit.Run(Codeunit::"PS_ImportarNominas");
                end;
            }
            action(PS_MonthlyClosingHelper)
            {
                Caption = 'Monthly Closing Helper';
                ApplicationArea = All;
                Image = Process;
                trigger OnAction()
                begin
                    Codeunit.Run(Codeunit::"PS_MonthlyClosingHelper");
                end;
            }
            action(PS_JobPlanningLineHandler)
            {
                Caption = 'Job Planning Line Handler';
                ApplicationArea = All;
                Image = Process;
                trigger OnAction()
                begin
                    Codeunit.Run(Codeunit::"PS_JobPlanningLineHandler");
                end;
            }
            action(PS_InsertTimeSheetLineAPI)
            {
                Caption = 'Insert TimeSheet Line API';
                ApplicationArea = All;
                Image = Process;
                trigger OnAction()
                begin
                    Codeunit.Run(Codeunit::"PS_InsertTimeSheetLineAPI");
                end;
            }
        }
    }
}
