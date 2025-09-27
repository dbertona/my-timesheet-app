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
            action(PopulateProjectResourceHours)
            {
                Caption = 'Populate Project Resource Hours';
                ApplicationArea = All;
                Image = Process;
                trigger OnAction()
                begin
                    Codeunit.Run(Codeunit::"PS_PopulateProjResHours");
                end;
            }
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
            action(MigrateMonthandYear)
            {
                Caption = 'Migrate Month and Year from PS_JobLedgerEntryMonthYear';
                ApplicationArea = All;
                Image = Process;
                trigger OnAction()
                begin
                    Codeunit.Run(Codeunit::"PS_MigrateMonthandYear");
                end;
            }
            action(JobLedgerEntryMonthYear)
            {
                Caption = 'Rearmo PS_JobLedgerEntryMonthYear Tabla que tiene mes y año unificado entre Fecha trabajo, Fecha Iva y Fecha de registro';
                ApplicationArea = All;
                Image = Process;
                trigger OnAction()
                begin
                    Codeunit.Run(Codeunit::"PS_ProceJobLedgerEntryMY");
                end;
            }
            action(PS_FillMonthClosing)
            {
                Caption = 'CREAR MESES PARA EL AÑO 2023';
                ApplicationArea = All;
                Image = Process;
                trigger OnAction()
                begin
                    Codeunit.Run(Codeunit::"PS_FillMonthClosing");
                end;
            }
            action(ProcessClosedMonthClosings)
            {
                Caption = 'Poner Real en Planificado Todos los meses cerrados';
                ApplicationArea = All;
                Image = Process;
                trigger OnAction()
                begin
                    Codeunit.Run(Codeunit::"PS_ProcessClosedMonthClosings");
                end;
            }
            action(ProcessLimpiarLineasAntiguas)
            {
                Caption = 'Limpiar líneas antiguas de histórico planificación';
                ApplicationArea = All;
                Image = Process;
                trigger OnAction()
                begin
                    Codeunit.Run(Codeunit::"PS_LimpiarPlanificacion");
                end;
            }
            action(RecalcularProbabilidad)
            {
                Caption = 'Recalcular Probabilidad';
                ApplicationArea = All;
                Image = Calculate;
                trigger OnAction()
                begin
                    Codeunit.Run(Codeunit::"PS_RecalcularProbabilidad");
                end;
            }
            action(PS_SyncJobPlanningLine)
            {
                Caption = 'Pongo real en histórico planificación enero 2025';
                ApplicationArea = All;
                Image = Calculate;
                trigger OnAction()
                begin
                    Codeunit.Run(Codeunit::"PS_SyncJobPlanningLine");
                end;
            }
            action(PS_CargarUnificacionPlanning)
            {
                Caption = 'Unifico planificación y expediente';
                ApplicationArea = All;
                Image = Calculate;
                trigger OnAction()
                begin
                    Codeunit.Run(Codeunit::"PS_CargarUnificacionPlanning");
                end;
            }
            action(PS_RenumerarPlanificadas)
            {
                Caption = 'Renumerar planificación';
                ApplicationArea = All;
                Image = Calculate;
                trigger OnAction()
                begin
                    Codeunit.Run(Codeunit::"PS_RenumerarPlanificadas");
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
        }
    }
}
