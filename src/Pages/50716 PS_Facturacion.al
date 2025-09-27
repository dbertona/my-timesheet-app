/* page 50716 "PS_Facturacion"
{
    PageType = List;
    SourceTable = "Resultado";
    ApplicationArea = All;
    UsageCategory = Lists; // Esto permite que la página sea accesible en la categoría de listas.

    layout
    {
        area(content)
        {
            repeater(Group)
            {
                field("Empresa"; Rec."Empresa")
                {
                    ApplicationArea = All;
                }
                field("Facturado"; Rec."Facturado")
                {
                    ApplicationArea = All;
                }
                field("Coste"; Rec."Coste")
                {
                    ApplicationArea = All;
                }
                field("Cantidad"; Rec."Cantidad")
                {
                    ApplicationArea = All;
                }
                field("CodigoUnicoDepartamento"; Rec."CodigoUnicoDepartamento")
                {
                    ApplicationArea = All;
                }
                field("FachaCalculada"; Rec."FachaCalculada")
                {
                    ApplicationArea = All;
                }
            }
        }
    }
    var
        Ps_Facturacion: Codeunit "DataProcessing";

    trigger OnOpenPage()
    begin
        // Ejecuta el codeunit cuando se abre la página
        Ps_Facturacion.ProcessData(); // Reemplaza 50408 con el ID de tu codeunit

        // Refresca la página para mostrar los nuevos datos en la tabla Resultado
        CurrPage.Update();
    end;
}
 */
