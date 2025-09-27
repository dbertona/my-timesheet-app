/// <summary>
/// Query PS_Expediente (ID 50016).
/// </summary>
query 50216 PS_Expediente
{
    Caption = 'PS_Expediente';
    QueryType = Normal;

    elements
    {
        dataitem(ARBVRNJobUnits; ARBVRNJobUnits)
        {
            column(ARBVRNJobNo; ARBVRNJobNo)
            {
            }
            column(ARBVRNAcumContractSalesAmount; ARBVRNAcumContractSalesAmount)
            {
            }

        }
    }

    trigger OnBeforeOpen()
    begin

    end;
}
