page 50719 "PS Planned billing"
{
    PageType = ListPart;
    ApplicationArea = Jobs;
    Caption = 'Planned Billing Detail';
    SourceTable = "PS_UniqueJobPlanningMatriz"; // Tu tabla con los datos
    Editable = False;
    QueryCategory = 'Job List';



    layout
    {
        area(content)
        {
            repeater("Project Data")
            {
                field("Job No."; Rec."Job No.")
                {
                    ApplicationArea = All;
                    Caption = 'No.';
                    Editable = True;

                    trigger OnDrillDown()
                    var
                        JobRec: Record Job; // Registro de la tabla Job
                        JobCardPageID: Integer;
                    begin
                        // Intentar obtener el registro del proyecto de la tabla Job
                        if JobRec.Get(Rec."Job No.") then begin
                            JobCardPageID := PAGE::"PS_Job _Card_Operational"; // ID de la página project Card
                            PAGE.Run(JobCardPageID, JobRec); // Abrir la página project Card con el registro del proyecto
                        end else begin
                            Message('No se encontró el proyecto con el número %1', Rec."Job No.");
                        end;
                    end;
                }
                field("Description"; Rec."Description")
                {
                    ApplicationArea = All;
                    Caption = 'Description';
                }

                // Definir los campos para los meses
                field("January"; Rec."JanInvoice")
                {
                    ApplicationArea = All;
                    Caption = 'January';
                    trigger OnDrillDown()
                    begin
                        OpenJobLedgerEntries(01, YearFilter); // Llamada al procedimiento para enero
                    end;
                }

                field("February"; Rec."FebInvoice")
                {
                    ApplicationArea = All;
                    Caption = 'February';
                    trigger OnDrillDown()
                    begin
                        OpenJobLedgerEntries(02, YearFilter); // Llamada al procedimiento para febrero
                    end;
                }

                field("March"; Rec."MarInvoice")
                {
                    ApplicationArea = All;
                    Caption = 'March';
                    trigger OnDrillDown()
                    begin
                        OpenJobLedgerEntries(03, YearFilter); // Llamada al procedimiento para marzo
                    end;
                }

                field("April"; Rec."AprInvoice")
                {
                    ApplicationArea = All;
                    Caption = 'April';
                    trigger OnDrillDown()
                    begin
                        OpenJobLedgerEntries(04, YearFilter); // Llamada al procedimiento para abril
                    end;
                }

                field("May"; Rec."MayInvoice")
                {
                    ApplicationArea = All;
                    Caption = 'May';
                    trigger OnDrillDown()
                    begin
                        OpenJobLedgerEntries(05, YearFilter); // Llamada al procedimiento para mayo
                    end;
                }

                field("June"; Rec."JunInvoice")
                {
                    ApplicationArea = All;
                    Caption = 'June';
                    trigger OnDrillDown()
                    begin
                        OpenJobLedgerEntries(06, YearFilter); // Llamada al procedimiento para junio
                    end;
                }

                field("July"; Rec."JulInvoice")
                {
                    ApplicationArea = All;
                    Caption = 'July';
                    trigger OnDrillDown()
                    begin
                        OpenJobLedgerEntries(07, YearFilter); // Llamada al procedimiento para julio
                    end;
                }

                field("August"; Rec."AugInvoice")
                {
                    ApplicationArea = All;
                    Caption = 'August';
                    trigger OnDrillDown()
                    begin
                        OpenJobLedgerEntries(08, YearFilter); // Llamada al procedimiento para agosto
                    end;
                }

                field("September"; Rec."SepInvoice")
                {
                    ApplicationArea = All;
                    Caption = 'September';
                    trigger OnDrillDown()
                    begin
                        OpenJobLedgerEntries(09, YearFilter); // Llamada al procedimiento para septiembre
                    end;
                }

                field("October"; Rec."OctInvoice")
                {
                    ApplicationArea = All;
                    Caption = 'October';
                    trigger OnDrillDown()
                    begin
                        OpenJobLedgerEntries(10, YearFilter); // Llamada al procedimiento para octubre
                    end;
                }

                field("November"; Rec."NovInvoice")
                {
                    ApplicationArea = All;
                    Caption = 'November';
                    trigger OnDrillDown()
                    begin
                        OpenJobLedgerEntries(11, YearFilter); // Llamada al procedimiento para noviembre
                    end;
                }

                field("December"; Rec."DecInvoice")
                {
                    ApplicationArea = All;
                    Caption = 'December';
                    trigger OnDrillDown()
                    begin
                        OpenJobLedgerEntries(12, YearFilter); // Llamada al procedimiento para diciembre
                    end;
                }
            }

            // Alinear los totales con los meses en el mismo layout
        }
    }

    var
        YearFilter: Integer; // Declaración de la variable YearFilter
        PS_UniqueJobPlanningRec: Record "PS_UniqueJobPlanningMatriz";
        NumOfRecords: Integer;
        RecordCount: Integer;
        ProgressMsg: Label 'Procesando.......#1######################\';
        Progress: Dialog;


    Procedure SetYear(Year: Integer)
    begin
        YearFilter := Year; // Asignar el año pasado desde la página principal
        PS_UniqueJobPlanningRec.DeleteAll();
        PopulateMatrix();    // Llamar a la función que llena la tabla temporal
        PopulateMatrixExpediente();
        TotalByMonth();
        CurrPage.SetRecord(PS_UniqueJobPlanningRec);
        CurrPage.Update(false); // Refrescar el ListPart para que muestre los datos actualizados
    end;

    procedure PopulateMatrixExpediente();
    var
        PS_UniqueJobPlanningRec: Record "PS_UniqueJobPlanningMatriz";
        PS_MonthClosingRec: Record "PS_MonthClosing";
        JobPlanningLineRec: Record "ARBVRNJobUnitPlanning";
        JobRec: Record "Job";
        LocalMonth: Integer;
        LocalMonthStr: Code[2];
        LocalYearStr: Code[4];
        TotalInvoice: Decimal;
        TotalCost: Decimal;
        CurrentJobNo: Code[20];
        PreviousJobNo: Code[20];
        COUNTA: INTEGER;
        FirstDayOfMonth: Date;
        LastDayOfMonth: Date;
        MONTH: INTEGER;

    begin
        // Inicializar la tabla temporal
        TotalInvoice := 0;
        TotalCost := 0;
        PreviousJobNo := '';

        // Verificar si hay un año seleccionado
        if YearFilter = 0 then begin
            Message('Por favor seleccione un año.');
            exit;
        end;

        // Filtrar en la tabla PS_MonthClosingRec para obtener solo meses abiertos en el año seleccionado
        PS_MonthClosingRec.SetRange("PS_Year", Format(YearFilter));
        PS_MonthClosingRec.SetRange("PS_Status", PS_MonthClosingRec.PS_Status::Open); // Solo meses abiertos
        //PS_MonthClosingRec.SetRange("PS_JobNo", 'PSI-OT-23-2008');

        if PS_MonthClosingRec.FindSet() then begin
            repeat
                // Obtenemos el proyecto y mes abierto
                CurrentJobNo := PS_MonthClosingRec."PS_JobNo";
                LocalMonthStr := PS_MonthClosingRec."PS_Month";
                LocalYearStr := PS_MonthClosingRec."PS_Year";
                Evaluate(LocalMonth, PS_MonthClosingRec."PS_Month");
                LocalMonthStr := Format(LocalMonth);
                EVALUATE(MONTH, PS_MonthClosingRec."PS_Month");
                FirstDayOfMonth := DMY2DATE(1, MONTH, YearFilter);
                lastDayOfMonth := CALCDATE('+1M', FirstDayOfMonth);
                LastDayOfMonth := CALCDATE('-1D', LastDayOfMonth);
                JobPlanningLineRec.SetRange("ARBVRNJobNo", CurrentJobNo);
                JobPlanningLineRec.SetRange("ARBVRNPlanningDate", FirstDayOfMonth, LastDayOfMonth);
                JobPlanningLineRec.SetRange("ARBVRNReal", FALSE);
                RecordCount := RecordCount + 1;
                Progress.Update(1, RecordCount);

                if JobPlanningLineRec.FindSet() then begin
                    repeat
                        JobRec.Get(CurrentJobNo);
                        IF JobPlanningLineRec.ARBVRNCertificationAmount <> 0 THEN BEGIN
                            if (JobRec.Status <> JobRec.Status::Lost) and (JobRec.Status <> JobRec.Status::Completed) then begin
                                if not PS_UniqueJobPlanningRec.Get(JobPlanningLineRec."ARBVRNJobNo", YearFilter) then begin
                                    PS_UniqueJobPlanningRec.Init();
                                    PS_UniqueJobPlanningRec.Description := JobRec.Description;
                                    PS_UniqueJobPlanningRec."Job No." := JobPlanningLineRec."ARBVRNJobNo";
                                    PS_UniqueJobPlanningRec.Year := YearFilter;
                                    PS_UniqueJobPlanningRec.Insert();
                                    PreviousJobNo := CurrentJobNo;
                                end;

                                // Asignar los valores a los meses correspondientes solo si están abiertos
                                case LocalMonth of
                                    1:
                                        begin
                                            PS_UniqueJobPlanningRec."JanInvoice" := PS_UniqueJobPlanningRec."JanInvoice" + JobPlanningLineRec.ARBVRNCertificationAmount;
                                            TotalInvoice += JobPlanningLineRec.ARBVRNCertificationAmount;

                                        end;
                                    2:
                                        begin
                                            PS_UniqueJobPlanningRec."FebInvoice" := PS_UniqueJobPlanningRec."FebInvoice" + JobPlanningLineRec.ARBVRNCertificationAmount;
                                            TotalInvoice += JobPlanningLineRec.ARBVRNCertificationAmount;
                                        end;
                                    3:
                                        begin
                                            PS_UniqueJobPlanningRec."MarInvoice" := PS_UniqueJobPlanningRec."MarInvoice" + JobPlanningLineRec.ARBVRNCertificationAmount;
                                            TotalInvoice += JobPlanningLineRec.ARBVRNCertificationAmount;
                                        end;
                                    4:
                                        begin
                                            PS_UniqueJobPlanningRec."AprInvoice" := PS_UniqueJobPlanningRec."AprInvoice" + JobPlanningLineRec.ARBVRNCertificationAmount;
                                            TotalInvoice += JobPlanningLineRec.ARBVRNCertificationAmount;
                                        end;
                                    5:
                                        begin
                                            PS_UniqueJobPlanningRec."MayInvoice" := PS_UniqueJobPlanningRec."MayInvoice" + JobPlanningLineRec.ARBVRNCertificationAmount;
                                            TotalInvoice += JobPlanningLineRec.ARBVRNCertificationAmount;
                                        end;
                                    6:
                                        begin
                                            PS_UniqueJobPlanningRec."JunInvoice" := PS_UniqueJobPlanningRec."JunInvoice" + JobPlanningLineRec.ARBVRNCertificationAmount;
                                            TotalInvoice += JobPlanningLineRec.ARBVRNCertificationAmount;
                                        end;
                                    7:
                                        begin
                                            PS_UniqueJobPlanningRec."JulInvoice" := PS_UniqueJobPlanningRec."JulInvoice" + JobPlanningLineRec.ARBVRNCertificationAmount;
                                            TotalInvoice += JobPlanningLineRec.ARBVRNCertificationAmount;
                                        end;
                                    8:
                                        begin
                                            PS_UniqueJobPlanningRec."AugInvoice" := PS_UniqueJobPlanningRec."AugInvoice" + JobPlanningLineRec.ARBVRNCertificationAmount;
                                            TotalInvoice += JobPlanningLineRec.ARBVRNCertificationAmount;
                                        end;
                                    9:
                                        begin
                                            PS_UniqueJobPlanningRec."SepInvoice" := PS_UniqueJobPlanningRec."SepInvoice" + JobPlanningLineRec.ARBVRNCertificationAmount;
                                            TotalInvoice += JobPlanningLineRec.ARBVRNCertificationAmount;
                                        end;
                                    10:
                                        begin
                                            PS_UniqueJobPlanningRec."OctInvoice" := PS_UniqueJobPlanningRec."OctInvoice" + JobPlanningLineRec.ARBVRNCertificationAmount;
                                            TotalInvoice += JobPlanningLineRec.ARBVRNCertificationAmount;
                                        end;
                                    11:
                                        begin
                                            PS_UniqueJobPlanningRec."NovInvoice" := PS_UniqueJobPlanningRec."NovInvoice" + JobPlanningLineRec.ARBVRNCertificationAmount;
                                            TotalInvoice += JobPlanningLineRec.ARBVRNCertificationAmount;
                                        end;
                                    12:
                                        begin
                                            PS_UniqueJobPlanningRec."DecInvoice" := PS_UniqueJobPlanningRec."DecInvoice" + JobPlanningLineRec.ARBVRNCertificationAmount;
                                            TotalInvoice += JobPlanningLineRec.ARBVRNCertificationAmount;

                                        end;
                                // Repetir para los demás meses
                                end;

                                PS_UniqueJobPlanningRec.Modify(); // Guardar los cambios en el registro temporal
                            END

                        end;

                    until JobPlanningLineRec.Next() = 0;
                end;

            until PS_MonthClosingRec.Next() = 0;
        end;
        CurrPage.Update(false); // Refrescar la página
    end;

    procedure PopulateMatrix();
    var
        JobPlanningLineRec: Record "Job Planning Line";
        PS_MonthClosingRec: Record "PS_MonthClosing";
        JobRec: Record "Job";
        LocalMonth: Integer;
        LocalMonthStr: Code[2];
        LocalYearStr: Code[4];
        TotalInvoice: Decimal;
        TotalCost: Decimal;
        CurrentJobNo: Code[20];
        PreviousJobNo: Code[20];
        COUNTA: INTEGER;
        FirstDayOfMonth: Date;
        LastDayOfMonth: Date;
        MONTH: INTEGER;
        Probability: Integer;
    begin
        // Inicializar la tabla temporal
        TotalInvoice := 0;
        TotalCost := 0;
        PreviousJobNo := '';

        // Verificar si hay un año seleccionado
        if YearFilter = 0 then begin
            Message('Por favor seleccione un año.');
            exit;
        end;

        PS_MonthClosingRec.SetRange("PS_Year", Format(YearFilter));
        PS_MonthClosingRec.SetRange("PS_Status", PS_MonthClosingRec.PS_Status::Open); // Solo meses abiertos
        Progress.OPEN(ProgressMsg, RecordCount);
        if PS_MonthClosingRec.FindSet() then begin
            repeat
                RecordCount := RecordCount + 1;
                Progress.Update(1, RecordCount);
                CurrentJobNo := PS_MonthClosingRec."PS_JobNo";
                LocalMonthStr := PS_MonthClosingRec."PS_Month";
                LocalYearStr := PS_MonthClosingRec."PS_Year";
                IF PS_MonthClosingRec."PS_Month" <> '' THEN BEGIN
                    Evaluate(LocalMonth, PS_MonthClosingRec."PS_Month");

                    LocalMonthStr := Format(LocalMonth);
                    EVALUATE(MONTH, PS_MonthClosingRec."PS_Month");
                    FirstDayOfMonth := DMY2DATE(1, MONTH, YearFilter);
                    lastDayOfMonth := CALCDATE('+1M', FirstDayOfMonth);
                    LastDayOfMonth := CALCDATE('-1D', LastDayOfMonth);
                    JobPlanningLineRec.SetRange("Job No.", CurrentJobNo);
                    JobPlanningLineRec.SetRange("Planning Date", FirstDayOfMonth, LastDayOfMonth);
                    // Buscamos el proyecto en la tabla de líneas de planificación de trabajo para el año seleccionado
                    if JobPlanningLineRec.FindSet() then begin
                        repeat
                            JobRec.Get(CurrentJobNo);
                            IF JobPlanningLineRec."Total Price (LCY)" <> 0 THEN BEGIN
                                case jobrec."PS_% Probability" of
                                    jobrec."PS_% Probability"::"0":
                                        begin
                                            Probability := 100;
                                        end;
                                    jobrec."PS_% Probability"::"10":
                                        begin
                                            Probability := 10;
                                        end;
                                    jobrec."PS_% Probability"::"30":
                                        begin
                                            Probability := 30;
                                        end;
                                    jobrec."PS_% Probability"::"50":
                                        begin
                                            Probability := 50;
                                        end;
                                    jobrec."PS_% Probability"::"70":
                                        begin
                                            Probability := 70;
                                        end;
                                    jobrec."PS_% Probability"::"90":
                                        begin
                                            Probability := 90;
                                        end;
                                end;

                                if (JobRec.Status <> JobRec.Status::Lost) and (JobRec.Status <> JobRec.Status::Completed) then begin
                                    if not PS_UniqueJobPlanningRec.Get(JobPlanningLineRec."Job No.", YearFilter) then begin
                                        PS_UniqueJobPlanningRec.Init();
                                        PS_UniqueJobPlanningRec.Description := JobRec.Description;
                                        PS_UniqueJobPlanningRec."Job No." := JobPlanningLineRec."Job No.";
                                        PS_UniqueJobPlanningRec.Year := YearFilter;
                                        PS_UniqueJobPlanningRec.Insert();
                                        PreviousJobNo := CurrentJobNo;
                                    end;

                                    // Asignar los valores a los meses correspondientes solo si están abiertos
                                    case LocalMonth of
                                        1:
                                            begin
                                                PS_UniqueJobPlanningRec."JanInvoice" := PS_UniqueJobPlanningRec."JanInvoice" + ((JobPlanningLineRec."Total Price (LCY)" * Probability) / 100);
                                                PS_UniqueJobPlanningRec."JanCost" := PS_UniqueJobPlanningRec."JanCost" + JobPlanningLineRec."Total Cost (LCY)";
                                                TotalInvoice += ((JobPlanningLineRec."Total Price (LCY)" * Probability) / 100);
                                                TotalCost += JobPlanningLineRec."Total Cost (LCY)";
                                            end;
                                        2:
                                            begin
                                                PS_UniqueJobPlanningRec."FebInvoice" := PS_UniqueJobPlanningRec."FebInvoice" + ((JobPlanningLineRec."Total Price (LCY)" * Probability) / 100);
                                                PS_UniqueJobPlanningRec."FebCost" := PS_UniqueJobPlanningRec."FebCost" + JobPlanningLineRec."Total Cost (LCY)";
                                                TotalInvoice += ((JobPlanningLineRec."Total Price (LCY)" * Probability) / 100);
                                                TotalCost += JobPlanningLineRec."Total Cost (LCY)";
                                            end;
                                        3:
                                            begin
                                                PS_UniqueJobPlanningRec."MarInvoice" := PS_UniqueJobPlanningRec."MarInvoice" + ((JobPlanningLineRec."Total Price (LCY)" * Probability) / 100);
                                                PS_UniqueJobPlanningRec."MarCost" := PS_UniqueJobPlanningRec."MarCost" + JobPlanningLineRec."Total Cost (LCY)";
                                                TotalInvoice += ((JobPlanningLineRec."Total Price (LCY)" * Probability) / 100);
                                                TotalCost += JobPlanningLineRec."Total Cost (LCY)";
                                            end;
                                        4:
                                            begin
                                                PS_UniqueJobPlanningRec."AprInvoice" := PS_UniqueJobPlanningRec."AprInvoice" + ((JobPlanningLineRec."Total Price (LCY)" * Probability) / 100);
                                                PS_UniqueJobPlanningRec."AprCost" := PS_UniqueJobPlanningRec."AprCost" + JobPlanningLineRec."Total Cost (LCY)";
                                                TotalInvoice += ((JobPlanningLineRec."Total Price (LCY)" * Probability) / 100);
                                                TotalCost += JobPlanningLineRec."Total Cost (LCY)";
                                            end;
                                        5:
                                            begin
                                                PS_UniqueJobPlanningRec."MayInvoice" := PS_UniqueJobPlanningRec."MayInvoice" + ((JobPlanningLineRec."Total Price (LCY)" * Probability) / 100);
                                                PS_UniqueJobPlanningRec."MayCost" := PS_UniqueJobPlanningRec."MayCost" + JobPlanningLineRec."Total Cost (LCY)";
                                                TotalInvoice += ((JobPlanningLineRec."Total Price (LCY)" * Probability) / 100);
                                                TotalCost += JobPlanningLineRec."Total Cost (LCY)";
                                            end;
                                        6:
                                            begin
                                                PS_UniqueJobPlanningRec."JunInvoice" := PS_UniqueJobPlanningRec."JunInvoice" + ((JobPlanningLineRec."Total Price (LCY)" * Probability) / 100);
                                                PS_UniqueJobPlanningRec."JunCost" := PS_UniqueJobPlanningRec."JunCost" + JobPlanningLineRec."Total Cost (LCY)";
                                                TotalInvoice += ((JobPlanningLineRec."Total Price (LCY)" * Probability) / 100);
                                                TotalCost += JobPlanningLineRec."Total Cost (LCY)";
                                            end;
                                        7:
                                            begin
                                                PS_UniqueJobPlanningRec."JulInvoice" := PS_UniqueJobPlanningRec."JulInvoice" + ((JobPlanningLineRec."Total Price (LCY)" * Probability) / 100);
                                                PS_UniqueJobPlanningRec."JulCost" := PS_UniqueJobPlanningRec."JulCost" + JobPlanningLineRec."Total Cost (LCY)";
                                                TotalInvoice += ((JobPlanningLineRec."Total Price (LCY)" * Probability) / 100);
                                                TotalCost += JobPlanningLineRec."Total Cost (LCY)";
                                            end;
                                        8:
                                            begin
                                                PS_UniqueJobPlanningRec."AugInvoice" := PS_UniqueJobPlanningRec."AugInvoice" + ((JobPlanningLineRec."Total Price (LCY)" * Probability) / 100);
                                                PS_UniqueJobPlanningRec."AugCost" := PS_UniqueJobPlanningRec."AugCost" + JobPlanningLineRec."Total Cost (LCY)";
                                                TotalInvoice += ((JobPlanningLineRec."Total Price (LCY)" * Probability) / 100);
                                                TotalCost += JobPlanningLineRec."Total Cost (LCY)";
                                            end;
                                        9:
                                            begin
                                                PS_UniqueJobPlanningRec."SepInvoice" := PS_UniqueJobPlanningRec."SepInvoice" + ((JobPlanningLineRec."Total Price (LCY)" * Probability) / 100);
                                                PS_UniqueJobPlanningRec."SepCost" := PS_UniqueJobPlanningRec."SepCost" + JobPlanningLineRec."Total Cost (LCY)";
                                                TotalInvoice += ((JobPlanningLineRec."Total Price (LCY)" * Probability) / 100);
                                                TotalCost += JobPlanningLineRec."Total Cost (LCY)";
                                            end;
                                        10:
                                            begin
                                                PS_UniqueJobPlanningRec."OctInvoice" := PS_UniqueJobPlanningRec."OctInvoice" + ((JobPlanningLineRec."Total Price (LCY)" * Probability) / 100);
                                                PS_UniqueJobPlanningRec."OctCost" := PS_UniqueJobPlanningRec."OctCost" + JobPlanningLineRec."Total Cost (LCY)";
                                                TotalInvoice += ((JobPlanningLineRec."Total Price (LCY)" * Probability) / 100);
                                                TotalCost += JobPlanningLineRec."Total Cost (LCY)";
                                            end;
                                        11:
                                            begin
                                                PS_UniqueJobPlanningRec."NovInvoice" := PS_UniqueJobPlanningRec."NovInvoice" + ((JobPlanningLineRec."Total Price (LCY)" * Probability) / 100);
                                                PS_UniqueJobPlanningRec."NovCost" := PS_UniqueJobPlanningRec."NovCost" + JobPlanningLineRec."Total Cost (LCY)";
                                                TotalInvoice += ((JobPlanningLineRec."Total Price (LCY)" * Probability) / 100);
                                                TotalCost += JobPlanningLineRec."Total Cost (LCY)";
                                            end;
                                        12:
                                            begin
                                                PS_UniqueJobPlanningRec."DecInvoice" := PS_UniqueJobPlanningRec."DecInvoice" + ((JobPlanningLineRec."Total Price (LCY)" * Probability) / 100);
                                                PS_UniqueJobPlanningRec."DecCost" := PS_UniqueJobPlanningRec."DecCost" + JobPlanningLineRec."Total Cost (LCY)";
                                                TotalInvoice += ((JobPlanningLineRec."Total Price (LCY)" * Probability) / 100);
                                                TotalCost += JobPlanningLineRec."Total Cost (LCY)";
                                            end;
                                    end;

                                    PS_UniqueJobPlanningRec.Modify();

                                end;
                            end;

                        until JobPlanningLineRec.Next() = 0;
                    end;
                END;
            until PS_MonthClosingRec.Next() = 0;
        end;

        CurrPage.Update(false); // Refrescar la página
    end;

    trigger OnClosePage()
    begin
        PS_UniqueJobPlanningRec.DeleteAll();
    end;

    procedure OpenJobLedgerEntries(PostingMonth: Integer; PostingYear: Integer)
    var
        JobLedgerEntryRec: Record "Job Ledger Entry";
        JobLedgerPageID: Integer;
        FirstDay: Date;
        LastDay: Date;
    begin
        JobLedgerPageID := PAGE::"Job Ledger Entries";

        // Calcular el primer y último día del mes
        FirstDay := DMY2DATE(1, PostingMonth, PostingYear); // Primer día del mes seleccionado
        LastDay := CALCDATE('+1M', FirstDay);
        LastDay := CALCDATE('-1D', LastDay);

        // Aplicar filtros
        JobLedgerEntryRec.SetRange("Job No.", Rec."Job No.");
        JobLedgerEntryRec.SetRange("Entry Type", JobLedgerEntryRec."Entry Type"::Sale); // Filtro para tipo "Venta"
        JobLedgerEntryRec.SetRange("Posting Date", FirstDay, LastDay); // Filtro para el mes seleccionado
        JobLedgerEntryRec.SetRange("ARBVRNWorkInProcess", false); // Filtro para ARBVRNWorkInProcess = No

        // Ejecutar la página con el filtro aplicado
        PAGE.RunModal(JobLedgerPageID, JobLedgerEntryRec);
    end;



    procedure TotalByMonth()
    var
        MonthlyTotals: array[12] of Decimal;
        i: Integer;
    begin
        for i := 1 to 12 do begin
            MonthlyTotals[i] := 0;
        end;
        if PS_UniqueJobPlanningRec.FindSet() then begin
            repeat
                // Sumar los valores de cada mes en el array MonthlyTotals
                MonthlyTotals[1] := MonthlyTotals[1] + PS_UniqueJobPlanningRec."JanInvoice";
                MonthlyTotals[2] := MonthlyTotals[2] + PS_UniqueJobPlanningRec."FebInvoice";
                MonthlyTotals[3] := MonthlyTotals[3] + PS_UniqueJobPlanningRec."MarInvoice";
                MonthlyTotals[4] := MonthlyTotals[4] + PS_UniqueJobPlanningRec."AprInvoice";
                MonthlyTotals[5] := MonthlyTotals[5] + PS_UniqueJobPlanningRec."MayInvoice";
                MonthlyTotals[6] := MonthlyTotals[6] + PS_UniqueJobPlanningRec."JunInvoice";
                MonthlyTotals[7] := MonthlyTotals[7] + PS_UniqueJobPlanningRec."JulInvoice";
                MonthlyTotals[8] := MonthlyTotals[8] + PS_UniqueJobPlanningRec."AugInvoice";
                MonthlyTotals[9] := MonthlyTotals[9] + PS_UniqueJobPlanningRec."SepInvoice";
                MonthlyTotals[10] := MonthlyTotals[10] + PS_UniqueJobPlanningRec."OctInvoice";
                MonthlyTotals[11] := MonthlyTotals[11] + PS_UniqueJobPlanningRec."NovInvoice";
                MonthlyTotals[12] := MonthlyTotals[12] + PS_UniqueJobPlanningRec."DecInvoice";
            until PS_UniqueJobPlanningRec.Next() = 0;
            PS_UniqueJobPlanningRec.Init();
            PS_UniqueJobPlanningRec.Description := '';
            PS_UniqueJobPlanningRec."Job No." := 'Total             ';
            PS_UniqueJobPlanningRec.Year := YearFilter;
            PS_UniqueJobPlanningRec."JanInvoice" := MonthlyTotals[1];
            PS_UniqueJobPlanningRec."FebInvoice" := MonthlyTotals[2];
            PS_UniqueJobPlanningRec."MarInvoice" := MonthlyTotals[3];
            PS_UniqueJobPlanningRec."AprInvoice" := MonthlyTotals[4];
            PS_UniqueJobPlanningRec."MayInvoice" := MonthlyTotals[5];
            PS_UniqueJobPlanningRec."JunInvoice" := MonthlyTotals[6];
            PS_UniqueJobPlanningRec."JulInvoice" := MonthlyTotals[7];
            PS_UniqueJobPlanningRec."AugInvoice" := MonthlyTotals[8];
            PS_UniqueJobPlanningRec."SepInvoice" := MonthlyTotals[9];
            PS_UniqueJobPlanningRec."OctInvoice" := MonthlyTotals[10];
            PS_UniqueJobPlanningRec."NovInvoice" := MonthlyTotals[11];
            PS_UniqueJobPlanningRec."DecInvoice" := MonthlyTotals[12];
            PS_UniqueJobPlanningRec.Insert();

        end;

    end;

    trigger OnOpenPage()
    begin
        // Filtrar para mostrar solo el registro donde "Job No." sea 'Total'
        Rec.SetFilter("Job No.", '<>%1', 'Total');
        ;
    end;
}
