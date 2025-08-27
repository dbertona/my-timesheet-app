/* codeunit 50408 "DataProcessing"
{
    procedure ProcessData()
    var
        CombinedRec: Record "PS_Combined_Data";
        ResultRec: Record "PS_Resultado";
        Invoice, Cost, Quantity : Decimal;
        Probability: Integer;
        Facturado, Coste, Cantidad : Decimal;
        Empresa1: Text;
    begin
        CombinedRec.DeleteAll();
        ResultRec.DeleteAll();

        // Ejecutar consultas y combinar resultados en CombinedRec
        //ExecutePlanificacionMes(CombinedRec);
        ExecuteMovimientosProyectosMes(CombinedRec);
        //ExecuteExpedienteMes(CombinedRec);

        // Procesar registros combinados
        if CombinedRec.FindSet then
            repeat
                Invoice := CombinedRec.Invoice;
                Cost := CombinedRec.cost;
                Quantity := CombinedRec.quantity;
                Probability := CombinedRec.probability;

                // Aplicar lógica de cálculo
                if Invoice = 0 then
                    Invoice := 0;

                if Probability = 0 then
                    Facturado := Invoice
                else
                    Facturado := (Invoice * Probability) / 100;

                if Probability = 0 then
                    Coste := Cost
                else
                    Coste := (Cost * Probability) / 100;

                if Probability = 0 then
                    Cantidad := Quantity
                else
                    Cantidad := (Quantity * Probability) / 100;

                // Calcular Empresa1 basado en el campo departamento
                if (CombinedRec.departamento = '1-06') then
                    Empresa1 := 'PS LAB CONSULTING SL'
                else
                    Empresa1 := 'Power Solution Iberia SL';

                // Insertar registro en la tabla temporal de resultados
                ResultRec.Empresa := Empresa1;
                ResultRec.Facturado := Facturado;
                ResultRec.Coste := Coste;
                ResultRec.Cantidad := Cantidad;
                ResultRec.CodigoUnicoDepartamento := Empresa1 + ':' + CombinedRec.departamento;
                ResultRec.FachaCalculada := CreateDate(CombinedRec.month, CombinedRec.year);
                ResultRec.ID := GetNextIDResultado();
                ResultRec.Insert;
            until CombinedRec.Next = 0;
    end;

    procedure ExecutePlanificacionMes(var CombinedRec: Record "PS_Combined_Data")
    var
        QueryRec: Query "PS_PlanificacionMes";
        TempRec: Record "PS_Combined_Data";
    begin
        QueryRec.Open;
        while QueryRec.Read do begin
            TempRec.Invoice := QueryRec.Invoice;
            TempRec.cost := QueryRec.cost;
            TempRec.quantity := QueryRec.quantity;
            TempRec.probability := QueryRec.probability;
            TempRec.departamento := QueryRec.departamento;
            TempRec.year := format(QueryRec.Year);
            TempRec.month := format(QueryRec.Month);
            TempRec.job := QueryRec.Job;
            TempRec.lineType := Format(QueryRec.LineType);
            TempRec.nr := ValueEntryToInteger(QueryRec.Nr);
            TempRec.typeLine := Format(QueryRec.TypeLine);
            TempRec.descripcion := QueryRec.Descripcion;
            TempRec.estado := Format(QueryRec.Estado);
            TempRec.tipoProyecto := Format(QueryRec.TipoProyecto);
            TempRec.budgetDateYear2 := format(QueryRec.BudgetDateYear);
            TempRec.budgetDateMonth2 := format(QueryRec.BudgetDateMonth);
            TempRec.status1 := Format(QueryRec.Status1);
            TempRec.descripcionCA := QueryRec.DescripcionCA;

            // Inserta directamente el registro en CombinedRec
            TempRec.ID := GetNextID();
            TempRec.Insert();
        end;
        QueryRec.Close;
    end;

    procedure ExecuteMovimientosProyectosMes(var CombinedRec: Record "PS_Combined_Data")
    var
        QueryRec: Query "PS_MovimientosProyectosMes";
        TempRec: Record "PS_Combined_Data";
        SelectedDate: Date;
    begin
        // Aplicar filtros para el proyecto y la fecha específica
        QueryRec.SetFilter("Job", 'PSI-OT-24-2000');
        QueryRec.SetFilter("DocumenDay", '01/01/2024');


        QueryRec.Open;
        while QueryRec.Read do begin
            TempRec.Invoice := QueryRec.Invoice;
            TempRec.cost := QueryRec.cost;
            TempRec.quantity := QueryRec.quantity;
            TempRec.probability := QueryRec.probability;
            TempRec.departamento := QueryRec.departamento;
            TempRec.year := QueryRec.BudgetDateYear;
            TempRec.month := QueryRec.BudgetDateMonth;
            TempRec.job := QueryRec.Job;
            TempRec.lineType := Format(QueryRec.LineType);
            TempRec.nr := ValueEntryToInteger(QueryRec.Nr);
            TempRec.typeLine := Format(QueryRec.TypeLine);
            TempRec.descripcion := QueryRec.Descripcion;
            TempRec.estado := Format(QueryRec.Estado);
            TempRec.tipoProyecto := Format(QueryRec.TipoProyecto);
            TempRec.budgetDateYear2 := QueryRec.BudgetDateYear;
            TempRec.budgetDateMonth2 := QueryRec.BudgetDateMonth;
            TempRec.status1 := Format(QueryRec.Status1);
            TempRec.descripcionCA := QueryRec.descripcionCA;

            if QueryRec.WorkDay = 0D then
                SelectedDate := QueryRec.DocumenDay
            else
                SelectedDate := QueryRec.WorkDay;

            TempRec.Date := SelectedDate;

            // Inserta directamente el registro en CombinedRec
            TempRec.ID := GetNextID();
            TempRec.Insert();
        end;
        QueryRec.Close;
    end;

    procedure ExecuteExpedienteMes(var CombinedRec: Record "PS_Combined_Data")
    var
        QueryRec: Query "PS_ExpedienteMes";
        TempRec: Record "PS_Combined_Data";
    begin
        QueryRec.Open;
        while QueryRec.Read do begin
            TempRec.Invoice := QueryRec.Invoice;
            TempRec.cost := 0;
            TempRec.quantity := 1;
            TempRec.probability := QueryRec.probability;
            TempRec.departamento := QueryRec.departamento;
            TempRec.year := format(QueryRec.BudgetDateYear);
            TempRec.month := format(QueryRec.BudgetDateMonth);
            TempRec.job := QueryRec.Job;
            TempRec.lineType := '';
            TempRec.nr := 0;
            TempRec.typeLine := '';
            TempRec.descripcion := QueryRec.Descripcion;
            TempRec.estado := Format(QueryRec.Estado);
            TempRec.tipoProyecto := Format(QueryRec.TipoProyecto);
            TempRec.budgetDateYear2 := format(QueryRec.BudgetDateYear);
            TempRec.budgetDateMonth2 := format(QueryRec.BudgetDateMonth);
            TempRec.status1 := Format(QueryRec.Status1);
            TempRec.descripcionCA := '';

            // Inserta directamente el registro en CombinedRec
            TempRec.ID := GetNextID();
            TempRec.Insert();
        end;
        QueryRec.Close;
    end;

    procedure CreateDate(Month: code[2]; Year: code[4]): Date
    var
        DateText: Text;
        ResultDate: Date;
    begin
        DateText := '1/' + Format(Month) + '/' + Format(Year);
        if Evaluate(ResultDate, DateText) then
            exit(ResultDate)
        else
            Error('Error al crear la fecha.');
    end;

    local procedure ValueEntryToInteger(ValueEntry: Code[20]): Integer
    var
        ResultInteger: Integer;
    begin
        if not Evaluate(ResultInteger, ValueEntry) then
            Error('Error al convertir Code[20] a Integer');
        exit(ResultInteger);
    end;

    procedure GetNextID(): Integer
    var
        LastRec: Record "PS_Combined_Data";
        NewID: Integer;
    begin
        // Obtener el último ID usado
        if LastRec.FindLast then
            NewID := LastRec.ID + 1
        else
            NewID := 1; // Iniciar desde 1 si no hay registros

        exit(NewID);
    end;

    procedure GetNextIDResultado(): Integer
    var
        LastRec: Record "PS_Resultado";
        NewID: Integer;
    begin
        // Obtener el último ID usado
        if LastRec.FindLast then
            NewID := LastRec.ID + 1
        else
            NewID := 1; // Iniciar desde 1 si no hay registros

        exit(NewID);
    end;
}
 */
