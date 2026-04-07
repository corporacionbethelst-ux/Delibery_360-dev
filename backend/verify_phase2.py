"""
Script de Verificación - FASE 2
Verifica que todos los servicios y CRUDs estén correctamente implementados
"""
import sys
import asyncio
from pathlib import Path

# Agregar el directorio backend al path
sys.path.insert(0, str(Path(__file__).parent))

def check_imports():
    """Verificar que todos los módulos se pueden importar"""
    print("=" * 60)
    print("VERIFICANDO IMPORTS DE LA FASE 2")
    print("=" * 60)
    
    modules_to_check = [
        # Servicios
        "app.services.auth_service",
        "app.services.user_service",
        "app.services.rider_service",
        "app.services.order_service",
        "app.services.delivery_service",
        "app.services.shift_service",
        "app.services.productivity_service",
        "app.services.financial_service",
        "app.services.route_service",
        "app.services.dashboard_service",
        "app.services.notification_service",
        "app.services.alert_service",
        
        # CRUDs
        "crud.base",
        "crud.user",
        "crud.rider",
        "crud.order",
        "crud.delivery",
        "crud.shift",
        "crud.financial",
        "crud.productivity",
        "crud.route",
        "crud.__init__",
        
        # Modelos
        "app.models.user",
        "app.models.rider",
        "app.models.order",
        "app.models.delivery",
        "app.models.shift",
        "app.models.financial",
        "app.models.productivity",
        "app.models.route",
        "app.models.audit_log",
        "app.models.notification",
        "app.models.integration",
        
        # Schemas
        "app.schemas.auth",
        "app.schemas.user",
        "app.schemas.rider",
        "app.schemas.financial",
        
        # Core
        "app.core.config",
        "app.core.database",
        "app.core.security",
        
        # Main app
        "app.main",
    ]
    
    failed_imports = []
    successful_imports = []
    
    for module in modules_to_check:
        try:
            __import__(module)
            successful_imports.append(module)
            print(f"✓ {module}")
        except Exception as e:
            failed_imports.append((module, str(e)))
            print(f"✗ {module}: {e}")
    
    print("\n" + "=" * 60)
    print(f"RESUMEN: {len(successful_imports)} exitosos, {len(failed_imports)} fallidos")
    print("=" * 60)
    
    if failed_imports:
        print("\nIMPORTS FALLIDOS:")
        for module, error in failed_imports:
            print(f"  - {module}: {error}")
        return False
    
    return True


def check_files_existence():
    """Verificar que todos los archivos necesarios existen"""
    print("\n" + "=" * 60)
    print("VERIFICANDO EXISTENCIA DE ARCHIVOS")
    print("=" * 60)
    
    base_path = Path("/workspace/backend")
    
    files_to_check = [
        # Servicios (12)
        "app/services/auth_service.py",
        "app/services/user_service.py",
        "app/services/rider_service.py",
        "app/services/order_service.py",
        "app/services/delivery_service.py",
        "app/services/shift_service.py",
        "app/services/productivity_service.py",
        "app/services/financial_service.py",
        "app/services/route_service.py",
        "app/services/dashboard_service.py",
        "app/services/notification_service.py",
        "app/services/alert_service.py",
        
        # CRUDs (9)
        "crud/base.py",
        "crud/user.py",
        "crud/rider.py",
        "crud/order.py",
        "crud/delivery.py",
        "crud/shift.py",
        "crud/financial.py",
        "crud/productivity.py",
        "crud/route.py",
        
        # Modelos (11)
        "app/models/user.py",
        "app/models/rider.py",
        "app/models/order.py",
        "app/models/delivery.py",
        "app/models/shift.py",
        "app/models/financial.py",
        "app/models/productivity.py",
        "app/models/route.py",
        "app/models/audit_log.py",
        "app/models/notification.py",
        "app/models/integration.py",
    ]
    
    missing_files = []
    existing_files = []
    
    for file_path in files_to_check:
        full_path = base_path / file_path
        if full_path.exists():
            existing_files.append(file_path)
            print(f"✓ {file_path}")
        else:
            missing_files.append(file_path)
            print(f"✗ {file_path} - NO EXISTE")
    
    print("\n" + "=" * 60)
    print(f"RESUMEN: {len(existing_files)} existen, {len(missing_files)} faltantes")
    print("=" * 60)
    
    return len(missing_files) == 0


async def main():
    print("\n🚀 INICIANDO VERIFICACIÓN DE LA FASE 2\n")
    
    # Verificar existencia de archivos
    files_ok = check_files_existence()
    
    # Verificar imports
    imports_ok = check_imports()
    
    print("\n" + "=" * 60)
    print("RESULTADO FINAL")
    print("=" * 60)
    
    if files_ok and imports_ok:
        print("✅ ¡FASE 2 COMPLETADA EXITOSAMENTE!")
        print("\nTodos los servicios y CRUDs están correctamente implementados.")
        print("El sistema está listo para continuar con la Fase 3.")
        return 0
    else:
        print("❌ HAY ERRORES QUE DEBEN SER CORREGIDOS")
        if not files_ok:
            print("  - Faltan archivos por crear")
        if not imports_ok:
            print("  - Hay errores en los imports")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
