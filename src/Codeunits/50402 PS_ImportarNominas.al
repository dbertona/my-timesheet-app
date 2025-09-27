codeunit 50402 "PS_ImportarNominas"
{
    TableNo = "Gen. Journal Line";

    var
        LineNo: Integer;

    trigger OnRun()
    begin
        // Lógica opcional que quieras ejecutar cuando se ejecute el codeunit
    end;

    procedure GetFileType(FileName: Text): Text
    var
        ExtensionStart: Integer;
    begin
        ExtensionStart := STRPOS(FileName, '.');
        if ExtensionStart > 0 then
            exit(LOWERCASE(COPYSTR(FileName, ExtensionStart + 1)))
        else
            exit('');
    end;

    procedure OpenAttachment(pFileAttachmentEntryNo: Integer)
    var
        AttachmentRec: Record Attachment;
        ResponseStream: InStream;
        tempfilename: Text;
        ErrorAttachment: Label 'No file available.';
    begin
        if AttachmentRec.Get(pFileAttachmentEntryNo) then
            if AttachmentRec."Attachment File".HasValue then begin
                AttachmentRec.CalcFields("Attachment File");
                AttachmentRec."Attachment File".CreateInStream(ResponseStream);
                tempfilename := CreateGuid() + '.' + AttachmentRec."File Extension";
                DOWNLOADFROMSTREAM(ResponseStream, 'Export', '', 'All Files (*.*)|*.*', tempfilename);
            end else
                Error(ErrorAttachment);
    end;

    procedure UploadAttachment()
    var
        AttachmentRec: Record Attachment;
        FileOutStream: OutStream;
        FileInStream: InStream;
        tempfilename: Text;
        DialogTitle: Label 'Please select a File...';
        FileType: Text;
        StoredFileInStream: InStream;
    begin
        // Intentar mostrar solo archivos .txt en el cuadro de diálogo
        if UploadIntoStream(DialogTitle, '', 'Text Files (*.txt)|*.txt|All files (*.*)|*.*', tempfilename, FileInStream) then begin
            // Asegurarse de que el archivo seleccionado tenga la extensión .txt
            if LOWERCASE(GetFileType(tempfilename)) <> 'txt' then begin
                Message('Por favor, seleccione un archivo con la extensión .txt.');
                exit;
            end;

            FileType := GetFileType(tempfilename);
            SaveAttachment(AttachmentRec, FileInStream, tempfilename, FileType);

            // Asegurarse de que el flujo de entrada esté inicializado antes de su uso
            AttachmentRec."Attachment File".CreateInStream(StoredFileInStream);

            // Incluir el nombre del archivo en el mensaje de confirmación
            if Confirm(STRSUBSTNO('¿Desea importar el archivo subido: %1?', tempfilename), false) then begin
                StoredFileInStream.Position := 1;
                ImportFileIntoGenJournalLine(StoredFileInStream);
            end;
        end else begin
            Message('No se seleccionó ningún archivo.');
        end;
    end;

    procedure SaveAttachment(var AttachmentRec: Record Attachment; FileInStream: InStream; tempfilename: Text; FileType: Text)
    var
        FileOutStream: OutStream;
    begin
        AttachmentRec.Init();
        AttachmentRec.Insert(true);
        AttachmentRec."Storage Type" := AttachmentRec."Storage Type"::Embedded;
        AttachmentRec."Storage Pointer" := '';
        AttachmentRec."File Extension" := FileType;
        AttachmentRec."Attachment File".CreateOutStream(FileOutStream);
        CopyStream(FileOutStream, FileInStream);
        AttachmentRec.Modify(true);
        // Inicializar flujo de entrada en SaveAttachment
        AttachmentRec."Attachment File".CreateInStream(FileInStream);
    end;

    procedure ImportFileIntoGenJournalLine(FileInStream: InStream)
    var
        LineText: Text[113];
        TotalDebit: Decimal;
        TotalCredit: Decimal;
        CurrentNroRecursoNomina: Code[20];
        PreviousNroRecursoNomina: Code[20];
        GenJnlLine: Record "Gen. Journal Line";
        GenJnlBatch: Record "Gen. Journal Batch";
        RecordCount: Integer;
    begin
        // Verificar si existen registros en "Gen. Journal Line" para el diario específico
        if GenJnlBatch.Get('GENERAL', 'NOMINAS') then begin
            GenJnlLine.SetRange("Journal Template Name", GenJnlBatch."Journal Template Name");
            GenJnlLine.SetRange("Journal Batch Name", GenJnlBatch.Name);
            if GenJnlLine.FindSet() then begin
                RecordCount := GenJnlLine.Count;
                if not Confirm(STRSUBSTNO('Existen %1 registros en el diario general "NOMINAS". ¿Desea borrarlos antes de importar?', RecordCount), false) then
                    exit;
                // Borrar los registros existentes
                GenJnlLine.DeleteAll();
                // Refrescar la página de diarios generales
                PAGE.Run(PAGE::"General Journal");
                if not Confirm(STRSUBSTNO('Los registros fueron borrados. ¿Desea continuar la importación?'), false) then
                    exit;
            end;
        end else begin
            Error('No se encontró el lote de diario general NOMINAS.');
        end;

        LineNo := 10000;
        TotalDebit := 0;
        TotalCredit := 0;

        while not FileInStream.EOS do begin
            FileInStream.ReadText(LineText);

            if IsValidLine(LineText) then begin
                CurrentNroRecursoNomina := COPYSTR(LineText, 61, 6);
                if (PreviousNroRecursoNomina = '') then
                    PreviousNroRecursoNomina := CurrentNroRecursoNomina;
                if (PreviousNroRecursoNomina <> '') and (CurrentNroRecursoNomina <> PreviousNroRecursoNomina) then begin
                    if TotalDebit <> TotalCredit then begin
                        if not Confirm('El asiento para el NroRecursoNomina %1 no cuadra. Débitos: %2, Créditos: %3. ¿Desea continuar con la importación?', false, PreviousNroRecursoNomina, TotalDebit, TotalCredit) then begin
                            Error('La importación ha sido cancelada debido a que el asiento no cuadra.');
                        end;
                    end;
                    PreviousNroRecursoNomina := CurrentNroRecursoNomina;
                    TotalDebit := 0;
                    TotalCredit := 0;
                end;

                ProcessLine(LineText, TotalDebit, TotalCredit);
                LineNo += 10000;
            end;
        end;

        if TotalDebit <> TotalCredit then begin
            if not Confirm('El asiento no cuadra. Débitos: %2, Créditos: %3. ¿Desea continuar con la importación?', false, PreviousNroRecursoNomina, TotalDebit, TotalCredit) then begin
                Error('La importación ha sido cancelada debido a que el asiento no cuadra.');
            end;
        end;

        // Refrescar la página de diarios generales antes del mensaje de registro
        PAGE.Run(PAGE::"General Journal");

        Message('El archivo se ha importado correctamente.');

        // Preguntar si desea registrar el asiento
        if Confirm('¿Desea registrar el asiento importado?', false) then begin
            PostJournalLines();
        end;
    end;

    procedure PostJournalLines()
    var
        GenJnlPostBatch: Codeunit "Gen. Jnl.-Post Batch";
        GenJnlLine: Record "Gen. Journal Line";
        GenJnlBatch: Record "Gen. Journal Batch";
    begin
        if GenJnlBatch.Get('GENERAL', 'NOMINAS') then begin
            GenJnlLine.SetRange("Journal Template Name", GenJnlBatch."Journal Template Name");
            GenJnlLine.SetRange("Journal Batch Name", GenJnlBatch.Name);
            if GenJnlLine.FindSet() then begin
                GenJnlPostBatch.Run(GenJnlLine);
            end;
        end else begin
            Error('No se encontró el lote de diario general NOMINAS.');
        end;
    end;

    procedure IsValidLine(LineText: Text[250]): Boolean
    begin
        exit((COPYSTR(LineText, 1, 2) <> 'EN') and (COPYSTR(LineText, 1, 2) <> '  '));
    end;

    procedure ProcessLine(LineText: Text[250]; var TotalDebit: Decimal; var TotalCredit: Decimal)
    var
        GenJnlLine: Record "Gen. Journal Line";
        GenJnlBatch: Record "Gen. Journal Batch";
        ResourceRec: Record Resource;
        Codigo: Text[10];
        Fecha: Text[8];
        Monto: Text[15];
        Descripcion: Text[100];
        CodigoInterno: Text[10];
        Tipo: Text[1];
        Concepto: Text[25];
        MontoConcepto: Text[15];
        Day, Month, Year : Integer;
        DecimalAmount: Decimal;
        NroRecursoNomina: Code[20];
        ResourceName: Text[50];
        NroRecursoNominaInt: Integer;
        ResourceNo: Code[20];
        JobNo: Code[20];
        JobTaskNo: Code[20];
    begin
        ExtractLineData(LineText, Codigo, Fecha, Monto, Descripcion, CodigoInterno, Tipo, Concepto, MontoConcepto, NroRecursoNomina);

        ValidateLineData(Codigo, Fecha, Monto, Descripcion, CodigoInterno, Tipo, Concepto, MontoConcepto, LineText);

        if not GenJnlBatch.Get('GENERAL', 'NOMINAS') then begin
            Error('No se encontró el lote de diario general NOMINAS.');
            exit;
        end;

        if not Evaluate(Day, COPYSTR(Fecha, 7, 2)) or not Evaluate(Month, COPYSTR(Fecha, 5, 2)) or not Evaluate(Year, COPYSTR(Fecha, 1, 4)) then begin
            Error('Formato de fecha incorrecto: %1', Fecha);
            exit;
        end;

        GenJnlLine.Init();
        GenJnlLine."Journal Template Name" := GenJnlBatch."Journal Template Name";
        GenJnlLine."Journal Batch Name" := GenJnlBatch.Name;
        GenJnlLine."Line No." := LineNo;
        GenJnlLine."Account No." := Codigo;
        GenJnlLine.Validate("Account No.", GenJnlLine."Account No.");
        GenJnlLine."Posting Date" := DMY2DATE(Day, Month, Year);
        GenJnlLine.Validate("Posting Date", GenJnlLine."Posting Date");

        NroRecursoNominaInt := ConvertNroRecursoNomina(NroRecursoNomina);

        // Obtener el nombre y No. del recurso
        ResourceName := GetResourceName(NroRecursoNominaInt, ResourceRec, ResourceNo);

        // Asignar la descripción basada en el valor de Codigo, si no coincide, usar la descripción del archivo
        Descripcion := GetDescripcionPorCodigo(Codigo, Descripcion) + ' -- ' + ResourceName;

        GenJnlLine.Description := Descripcion;
        GenJnlLine."Document No." := ResourceNo; // Asignar el campo "No." al campo "Document No."
        MontoConcepto := CONVERTSTR(MontoConcepto, '.', ',');
        if not Evaluate(DecimalAmount, MontoConcepto) then begin
            Error('MontoConcepto no es un número válido: %1', MontoConcepto);
            exit;
        end;
        if Tipo = 'H' then begin
            GenJnlLine.Amount := DecimalAmount * -1;
            GenJnlLine."Amount (LCY)" := DecimalAmount * -1;
            TotalCredit += DecimalAmount;
        end else begin
            GenJnlLine.Amount := DecimalAmount;
            GenJnlLine."Amount (LCY)" := DecimalAmount;
            TotalDebit += DecimalAmount;
        end;
        GenJnlLine.Validate("Amount", GenJnlLine."Amount");

        // Buscar valores de ARBVRNDesviationJob y ARBVRNDesviationJobTask si la cuenta es 64000000 o 64200000
        if (Codigo = '64000000') or (Codigo = '64200000') then begin
            if ResourceRec.Get(ResourceNo) then begin
                JobNo := ResourceRec."ARBVRNDesviationJob";
                JobTaskNo := ResourceRec."ARBVRNDesviationJobTask";
                GenJnlLine."Job No." := JobNo;
                GenJnlLine."Job Task No." := JobTaskNo;
                //        GenJnlLine."Shortcut Dimension 1 Code" := ResourceRec."Global Dimension 1 Code"
            end;
        end;
        GenJnlLine.Validate("Job No.", GenJnlLine."Job No.");
        GenJnlLine.Validate("Job Task No.", GenJnlLine."Job Task No.");
        GenJnlLine."Gen. Prod. Posting Group" := '';
        GenJnlLine."Gen. Posting Type" := GenJnlLine."Gen. Posting Type"::" ";
        GenJnlLine."VAT Prod. Posting Group" := ' ';
        GenJnlLine.Insert();

        if (Codigo = '64010000') then begin
            GenJnlLine.Amount := DecimalAmount * -1;
            GenJnlLine."Amount (LCY)" := DecimalAmount * -1;
            LineNo += 10000;
            GenJnlLine."Line No." := LineNo;
            GenJnlLine."Bal. Account Type" := GenJnlLine."Bal. Account Type"::Vendor;
            GenJnlLine."Bal. Account No." := StrSubstNo('%1%2', 'E', CopyStr(ResourceNo, 4));
            IF CopyStr(ResourceNo, 1, 4) = 'RLAB' then
                GenJnlLine."Bal. Account No." := StrSubstNo('%1%2', 'ELAB', CopyStr(ResourceNo, 5))
            ELSE
                GenJnlLine."Bal. Account No." := StrSubstNo('%1%2', 'E', CopyStr(ResourceNo, 4));

            GenJnlLine."Gen. Prod. Posting Group" := '';
            GenJnlLine."Gen. Posting Type" := GenJnlLine."Gen. Posting Type"::" ";
            GenJnlLine."VAT Prod. Posting Group" := ' ';
            GenJnlLine.Validate(GenJnlLine.Amount);
            GenJnlLine.Insert();
        end;
    end;


    procedure GetDescripcionPorCodigo(Codigo: Text[10]; DefaultDescripcion: Text[100]): Text[100]
    begin
        case Codigo of
            '46500000':
                exit('Líquido');
            '47510000':
                exit('IRPF');
            '47600000':
                exit('Total Seguridad Social');
            '64000000':
                exit('Bruto');
            '64010000':
                exit('Kilometraje');
            '64200000':
                exit('Seguridad Social Empresa');
            '75500000':
                exit('Descuentos Salario en Especies');
            else
                exit(DefaultDescripcion);
        end;
    end;

    procedure ExtractLineData(LineText: Text[250]; var Codigo: Text[10]; var Fecha: Text[8]; var Monto: Text[15]; var Descripcion: Text[100]; var CodigoInterno: Text[10]; var Tipo: Text[1]; var Concepto: Text[25]; var MontoConcepto: Text[15]; var NroRecursoNomina: Code[20])
    begin
        Codigo := COPYSTR(LineText, 16, 8);
        IF Codigo = '641101  ' THEN
            Codigo := '64000000';
        Fecha := COPYSTR(LineText, 7, 8);
        Monto := COPYSTR(LineText, 100, 14);
        Descripcion := COPYSTR(LineText, 28, 25);
        CodigoInterno := COPYSTR(LineText, 59, 10);
        Tipo := COPYSTR(LineText, 58, 1);
        Concepto := COPYSTR(LineText, 70, 25);
        MontoConcepto := COPYSTR(LineText, 100, 14);
        NroRecursoNomina := COPYSTR(LineText, 61, 6);
    end;

    procedure ValidateLineData(Codigo: Text[10]; Fecha: Text[8]; Monto: Text[15]; Descripcion: Text[100]; CodigoInterno: Text[10]; Tipo: Text[1]; Concepto: Text[25]; MontoConcepto: Text[15]; LineText: Text[250])
    begin
        if (STRLEN(Codigo) = 0) or (STRLEN(Fecha) = 0) or (STRLEN(Monto) = 0) or (STRLEN(Descripcion) = 0) or
           (STRLEN(CodigoInterno) = 0) or (STRLEN(Tipo) = 0) or (STRLEN(Concepto) = 0) or (STRLEN(MontoConcepto) = 0) then begin
            Error('Formato de línea incorrecto: %1', LineText);
            exit;
        end;
    end;

    procedure ConvertNroRecursoNomina(NroRecursoNomina: Code[20]): Integer
    var
        NroRecursoNominaInt: Integer;
    begin
        if not Evaluate(NroRecursoNominaInt, FORMAT(NroRecursoNomina)) then
            Error('Formato de NroRecursoNomina incorrecto: %1', NroRecursoNomina);
        exit(NroRecursoNominaInt);
    end;

    procedure GetResourceName(NroRecursoNominaInt: Integer; var ResourceRec: Record Resource; var ResourceNo: Code[20]): Text[50]
    var
        ResourceName: Text[50];
        EmptyNroRecursoNominaRec: Record Resource;
        SelectionConfirmed: Boolean;
    begin
        ResourceRec.SetRange(ResourceRec."NroRecursoNomina", FORMAT(NroRecursoNominaInt));
        if ResourceRec.FindFirst then begin
            ResourceName := ResourceRec.Name;
            ResourceNo := ResourceRec."No.";
        end else begin
            Commit(); // Commit the current transaction before running modal page

            Message('No se encontró el recurso con el Número de recurso en nómina %1. Por favor, seleccione el recurso correspondiente de la lista.', FORMAT(NroRecursoNominaInt));

            // Buscar recursos con NroRecursoNomina vacío
            EmptyNroRecursoNominaRec.SetRange(EmptyNroRecursoNominaRec."NroRecursoNomina", '');
            if EmptyNroRecursoNominaRec.FindSet() then begin
                // Mostrar la página modal y permitir la selección del recurso
                if PAGE.RunModal(PAGE::"Resource List", EmptyNroRecursoNominaRec) = ACTION::LookupOK then begin
                    // Asegurar que estamos obteniendo el recurso correcto seleccionado
                    if EmptyNroRecursoNominaRec.Get(EmptyNroRecursoNominaRec."No.") then begin
                        EmptyNroRecursoNominaRec."NroRecursoNomina" := FORMAT(NroRecursoNominaInt);
                        EmptyNroRecursoNominaRec.Modify(true);
                        ResourceName := EmptyNroRecursoNominaRec.Name;
                        ResourceNo := EmptyNroRecursoNominaRec."No.";
                    end else begin
                        if not Confirm('¿Desea continuar sin asignar un recurso?', false) then
                            Error('La importación ha sido cancelada porque el recurso no fue encontrado.');
                        ResourceName := 'Nombre no encontrado';
                        ResourceNo := '';
                    end;
                end else begin
                    if not Confirm('¿Desea continuar sin asignar un recurso?', false) then
                        Error('La importación ha sido cancelada porque el recurso no fue encontrado.');
                    ResourceName := 'Nombre no encontrado';
                    ResourceNo := '';
                end;
            end else begin
                if not Confirm('No hay recursos con NroRecursoNomina vacío. ¿Desea continuar sin asignar un recurso?', false) then
                    Error('La importación ha sido cancelada porque el recurso no fue encontrado.');
                ResourceName := 'Nombre no encontrado';
                ResourceNo := '';
            end;
        end;
        exit(ResourceName);
    end;

}
