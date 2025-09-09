#!/usr/bin/env python3
"""
Script para modificar la clave primaria de la tabla job en Supabase
Cambia de solo 'no' a compuesta por 'no' y 'company_name'
"""

import os
import sys
from supabase import create_client, Client

def main():
    # Configuración de Supabase
    SUPABASE_URL = "https://qfpswxjunoepznrpsltt.supabase.co"
    SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHN3eGp1bm9lcHpucnBzbHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg3MTA3OSwiZXhwIjoyMDY5NDQ3MDc5fQ.PxpfuFsfvpeEPHCEiWhRn0SD1WxngTAEppJ-65QTTOQ"

    try:
        # Crear cliente de Supabase
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

        print("🔧 Modificando clave primaria de la tabla job...")

        # Paso 1: Eliminar la clave primaria actual
        print("1. Eliminando clave primaria actual...")
        result1 = supabase.rpc('exec_sql', {
            'sql': "ALTER TABLE job DROP CONSTRAINT IF EXISTS job_pkey;"
        }).execute()
        print("   ✅ Clave primaria actual eliminada")

        # Paso 2: Añadir la nueva clave primaria compuesta
        print("2. Añadiendo nueva clave primaria compuesta...")
        result2 = supabase.rpc('exec_sql', {
            'sql': "ALTER TABLE job ADD CONSTRAINT job_pkey PRIMARY KEY (no, company_name);"
        }).execute()
        print("   ✅ Nueva clave primaria compuesta añadida")

        # Paso 3: Verificar la estructura de la tabla
        print("3. Verificando estructura de la tabla...")
        result3 = supabase.rpc('exec_sql', {
            'sql': """
            SELECT
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_name = 'job'
            ORDER BY ordinal_position;
            """
        }).execute()

        print("   📋 Estructura de la tabla job:")
        for row in result3.data:
            print(f"      - {row['column_name']}: {row['data_type']} {'(nullable)' if row['is_nullable'] == 'YES' else '(not null)'}")

        # Paso 4: Verificar la nueva clave primaria
        print("4. Verificando nueva clave primaria...")
        result4 = supabase.rpc('exec_sql', {
            'sql': """
            SELECT
                constraint_name,
                constraint_type,
                column_name
            FROM information_schema.key_column_usage
            WHERE table_name = 'job'
            AND constraint_name = 'job_pkey';
            """
        }).execute()

        print("   🔑 Clave primaria actual:")
        for row in result4.data:
            print(f"      - {row['column_name']} ({row['constraint_type']})")

        print("\n✅ ¡Modificación completada exitosamente!")
        print("   La tabla job ahora tiene clave primaria compuesta por 'no' y 'company_name'")

    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
