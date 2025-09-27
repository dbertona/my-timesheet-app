/// <summary>
/// Query PS_MovimientoIva (ID 50011).
/// </summary>
query 50211 PS_PresentacionIva
{
    Caption = 'PS_PresentacionIva';
    APIGroup = 'PS_API';
    APIPublisher = 'Power_Solution';
    APIVersion = 'v2.0';
    EntityName = 'PresentacionIva';
    EntitySetName = 'PresentacionIva';
    QueryType = API;

    elements
    {
        dataitem(VATEntry; "VAT Entry")
        {
            column(PostingDate; "Posting Date")
            {
            }
            column(FechaIva; "VAT Reporting Date")
            {
            }
            column(DocumentNo; "Document No.")
            {
            }
            column(CountryRegionCode; "Country/Region Code")
            {
            }
            column(BilltoPaytoNo; "Bill-to/Pay-to No.")
            {
            }
            column(VATRegistrationNo; "VAT Registration No.")
            {
            }
            column(ExternalDocumentNo; "External Document No.")
            {
            }
            column(GenBusPostingGroup; "Gen. Bus. Posting Group")
            {
            }
            column(VATProdPostingGroup; "VAT Prod. Posting Group")
            {
            }
            column(DocumentType; "Document Type")
            {
            }
            column("Type"; "Type")
            {
            }
            column(Base; Base)
            {
            }
            column(VAT; "VAT %")
            {
            }
            column(EC; "EC %")
            {
            }
            column(Amount; Amount)
            {
            }
            dataitem(Clintes; "Customer")
            {
                DataItemLink = "No." = VATEntry."Bill-to/Pay-to No.";
                SqlJoinType = LeftOuterJoin;
                column(Cliente; Name) { }
                dataitem(Proveedores; "Vendor")
                {
                    DataItemLink = "No." = VATEntry."Bill-to/Pay-to No.";
                    SqlJoinType = LeftOuterJoin;
                    column(Proveedor; Name) { }
                }
            }
        }
    }

    trigger OnBeforeOpen()
    begin

    end;
}

