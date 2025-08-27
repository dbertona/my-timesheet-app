page 50151 "Internal Procedure"
{
    PageType = Card;
    ApplicationArea = All;
    UsageCategory = Administration;
    Caption = 'Internal Procedure';

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

                    Codeunit.Run(Codeunit::"PopulateProjectResourceHours");
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
                    Codeunit.Run(Codeunit::"MigrateMonthandYear");
                end;
            }
            action(JobLedgerEntryMonthYear)
            {
                Caption = 'Rearmo PS_JobLedgerEntryMonthYear Tabla que tiene mes y año unificado entre Fecha trabajo, Fecha Iva y Fecha de registro';
                ApplicationArea = All;
                Image = Process;
                trigger OnAction()
                begin
                    Codeunit.Run(Codeunit::"ProceJobLedgerEntryMonthYear");
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
                    Codeunit.Run(Codeunit::"ProcessClosedMonthClosings");
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

        }
    }
}
page 50152 "PS Job Planning Lines"
{
    PageType = List;
    SourceTable = "PS_JobPlanningLine";
    ApplicationArea = All;
    UsageCategory = Lists;

    layout
    {
        area(content)
        {
            repeater(Group)
            {
                field("PS_LineNo."; Rec."PS_LineNo.") { }
                field("PS_JobNo."; Rec."PS_JobNo.") { }
                field("PS_PlanningDate"; Rec."PS_PlanningDate") { }
                field("PS_DocumentNo."; Rec."PS_DocumentNo.") { }
                field(PS_Type; Rec.PS_Type) { }
                field("PS_No."; Rec."PS_No.") { }
                field(PS_Description; Rec.PS_Description) { }
                field(PS_Quantity; Rec.PS_Quantity) { }
                field("PS_DirectUnitCost(LCY)"; Rec."PS_DirectUnitCost(LCY)") { }
                field("PS_UnitCost(LCY)"; Rec."PS_UnitCost(LCY)") { }
                field("PS_TotalCost(LCY)"; Rec."PS_TotalCost(LCY)") { }
                field("PS_UnitPrice(LCY)"; Rec."PS_UnitPrice(LCY)") { }
                field("PS_TotalPrice(LCY)"; Rec."PS_TotalPrice(LCY)") { }
                field("PS_ResourceGroupNo."; Rec."PS_ResourceGroupNo.") { }
                field("PS_UnitofMeasureCode"; Rec."PS_UnitofMeasureCode") { }
                field("PS_LastDateModified"; Rec."PS_LastDateModified") { }
                field("PS_UserID"; Rec."PS_UserID") { }
                field("PS_WorkTypeCode"; Rec."PS_WorkTypeCode") { }
                field("PS_DocumentDate"; Rec."PS_DocumentDate") { }
                field("PS_JobTaskNo."; Rec."PS_JobTaskNo.") { }
                field("PS_LineType"; Rec."PS_LineType") { }
                field("PS_CurrencyCode"; Rec."PS_CurrencyCode") { }
                field("PS_CurrencyDate"; Rec."PS_CurrencyDate") { }
                field(PS_Status; Rec.PS_Status) { }
                field("PS_ClosingMonthCode"; Rec."PS_ClosingMonthCode") { }
                field("PS_% Probability"; Rec."PS_% Probability") { }
                field("PS_ProbabilizedPrice(LCY)"; Rec."PS_ProbabilizedPrice(LCY)") { }
                field("PS_ProbabilizedCost(LCY)"; Rec."PS_ProbabilizedCost(LCY)") { }
            }
        }
    }
}
