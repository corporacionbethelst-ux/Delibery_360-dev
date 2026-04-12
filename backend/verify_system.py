#!/usr/bin/env python3
"""
Script de Verificación del Sistema - Delivery360
Verifica si la máquina dispone de todos los requisitos para ejecutar el sistema.
"""

import sys
import subprocess
import importlib.util
from pathlib import Path
from typing import List, Tuple, Optional
import json
import os
from dotenv import load_dotenv

class Color:
    """Colores para output en terminal"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(text: str):
    """Imprime un encabezado destacado"""
    print(f"\n{Color.CYAN}{Color.BOLD}{'='*80}{Color.RESET}")
    print(f"{Color.CYAN}{Color.BOLD}{text.center(80)}{Color.RESET}")
    print(f"{Color.CYAN}{Color.BOLD}{'='*80}{Color.RESET}\n")

def print_section(text: str):
    """Imprime una sección"""
    print(f"\n{Color.BLUE}{Color.BOLD}▶ {text}{Color.RESET}\n")

def success_check(item: str, version: Optional[str] = None):
    """Marca un item como verificado correctamente"""
    version_str = f" ({version})" if version else ""
    print(f"  {Color.GREEN}✓{Color.RESET} {item}{Color.GREEN}{version_str}{Color.RESET}")

def error_check(item: str, error_msg: str):
    """Marca un item como fallido"""
    print(f"  {Color.RED}✗{Color.RESET} {item}")
    print(f"      {Color.RED}Error: {error_msg}{Color.RESET}")

def warning_check(item: str, warning_msg: str):
    """Marca un item con advertencia"""
    print(f"  {Color.YELLOW}⚠{Color.RESET} {item}")
    print(f"      {Color.YELLOW}Nota: {warning_msg}{Color.RESET}")

def check_python_version() -> Tuple[bool, str]:
    """Verifica la versión de Python"""
    required_version = (3, 10)
    current_version = sys.version_info[:2]
    
    if current_version >= required_version:
        version_str = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
        return True, version_str
    else:
        return False, f"{sys.version_info.major}.{sys.version_info.minor}"

def check_system_packages() -> List[Tuple[str, bool, str]]:
    """Verifica paquetes del sistema necesarios"""
    results = []
    
    # Verificar comandos del sistema
    system_commands = [
        ('docker', 'Docker'),
        ('docker-compose', 'Docker Compose'),
        ('git', 'Git'),
        ('psql', 'PostgreSQL client'),
        ('redis-cli', 'Redis client'),
    ]
    
    for cmd, name in system_commands:
        try:
            result = subprocess.run(
                ['which', cmd],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                # Obtener versión
                version_result = subprocess.run(
                    [cmd, '--version'],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                version = version_result.stdout.split('\n')[0][:50] if version_result.returncode == 0 else 'N/A'
                results.append((name, True, version))
            else:
                results.append((name, False, 'No instalado'))
        except Exception as e:
            results.append((name, False, str(e)))
    
    return results

def check_python_packages(requirements_file: Path) -> Tuple[List[Tuple[str, bool, str]], List[Tuple[str, str, str]]]:
    """Verifica si los paquetes de Python están instalados y sus versiones
    
    Returns:
        Tuple con:
        - Lista de resultados (paquete, ok, info)
        - Lista de problemas (paquete, version_actual, version_requerida)
    """
    results = []
    problems = []
    
    if not requirements_file.exists():
        return results, [('requirements.txt', 'N/A', 'Archivo no encontrado')]
    
    with open(requirements_file, 'r') as f:
        lines = f.readlines()
    
    for line in lines:
        line = line.strip()
        
        # Saltar comentarios y líneas vacías
        if not line or line.startswith('#'):
            continue
        
        # Parsear requerimiento (ej: fastapi>=0.100.0, sqlalchemy==2.0.0)
        try:
            # Extraer nombre del paquete y versión requerida
            if '>=' in line:
                package_name, required_version = line.split('>=')
                operator = '>='
            elif '==' in line:
                package_name, required_version = line.split('==')
                operator = '=='
            elif '<=' in line:
                package_name, required_version = line.split('<=')
                operator = '<='
            elif '>' in line:
                package_name, required_version = line.split('>')
                operator = '>'
            elif '<' in line:
                package_name, required_version = line.split('<')
                operator = '<'
            else:
                package_name = line
                required_version = None
                operator = None
            
            package_name = package_name.strip().split('[')[0]  # Remover extras como [security]
            
            # Mapeo de nombres de paquetes que tienen diferente nombre de importación
            package_import_map = {
                'psycopg2-binary': 'psycopg2',
                'python-jose': 'jose',
                'python-multipart': 'multipart',
                'pydantic-settings': 'pydantic_settings',
                'email-validator': 'email_validator',
                'prometheus-client': 'prometheus_client',
                'python-dateutil': 'dateutil',
                'pytest-asyncio': 'pytest_asyncio',
            }
            
            import_name = package_import_map.get(package_name, package_name)
            
            # Verificar si el paquete está instalado
            spec = importlib.util.find_spec(import_name)
            if spec is not None:
                try:
                    module = importlib.import_module(import_name)
                    installed_version = getattr(module, '__version__', 'desconocida')
                    
                    # Comparar versiones si se especificó requerimiento
                    if required_version:
                        from packaging import version as pkg_version
                        try:
                            installed_v = pkg_version.parse(installed_version)
                            required_v = pkg_version.parse(required_version)
                            
                            version_ok = False
                            if operator == '>=':
                                version_ok = installed_v >= required_v
                            elif operator == '==':
                                version_ok = installed_v == required_v
                            elif operator == '<=':
                                version_ok = installed_v <= required_v
                            elif operator == '>':
                                version_ok = installed_v > required_v
                            elif operator == '<':
                                version_ok = installed_v < required_v
                            
                            if version_ok:
                                results.append((package_name, True, f'{installed_version} (req: {operator}{required_version})'))
                            else:
                                results.append((package_name, False, f'{installed_version} (req: {operator}{required_version})'))
                                problems.append((package_name, installed_version, f'{operator}{required_version}'))
                        except Exception as e:
                            # Si no se puede comparar, solo mostrar información
                            results.append((package_name, True, f'{installed_version} (req: {operator}{required_version}) - no verificable'))
                    else:
                        results.append((package_name, True, installed_version))
                        
                except Exception as e:
                    results.append((package_name, True, f'instalado (versión desconocida)'))
            else:
                results.append((package_name, False, 'No instalado'))
                problems.append((package_name, 'no instalado', 'requerido'))
                
        except Exception as e:
            results.append((line, False, f'Error al parsear: {str(e)}'))
            problems.append((line, 'error', str(e)))
    
    return results, problems

def check_directory_structure() -> List[Tuple[str, bool, str]]:
    """Verifica la estructura de directorios del proyecto"""
    results = []
    
    required_dirs = [
        'backend/app',
        'backend/app/api/v1',
        'backend/app/core',
        'backend/app/models',
        'backend/app/schemas',
        'backend/app/services',
        'backend/app/crud',
        'backend/app/middleware',
        'backend/app/utils',
        'backend/app/workers',
        'backend/alembic',
        'frontend/src',
        'frontend/src/app',
        'frontend/src/components',
        'frontend/src/lib',
    ]
    
    required_files = [
        'backend/requirements.txt',
        'backend/app/main.py',
        'backend/Dockerfile',
        'backend/docker-compose.yml',
        'backend/.env.example',
        'backend/alembic.ini',
        'frontend/Dockerfile',
        'frontend/package.json',
    ]
    
    for directory in required_dirs:
        path = Path('/workspace') / directory
        if path.exists() and path.is_dir():
            file_count = len(list(path.glob('*.py')))
            results.append((directory, True, f'{file_count} archivos Python'))
        else:
            results.append((directory, False, 'Directorio no existe'))
    
    for file in required_files:
        path = Path('/workspace') / file
        if path.exists() and path.is_file():
            size = path.stat().st_size
            results.append((file, True, f'{size} bytes'))
        else:
            results.append((file, False, 'Archivo no existe'))
    
    return results

def check_env_variables() -> List[Tuple[str, bool, str]]:
    """Verifica variables de entorno críticas"""
    results = []
    
    # Cargar .env si existe
    env_file = Path('/workspace/backend/.env')
    if env_file.exists():
        load_dotenv(env_file)
        results.append(('.env file', True, 'Cargado correctamente'))
    else:
        results.append(('.env file', False, 'No existe, usando .env.example'))
    
    # Variables críticas
    critical_vars = [
        'SECRET_KEY',
        'DATABASE_URL',
        'REDIS_URL',
        'JWT_ALGORITHM',
        'ACCESS_TOKEN_EXPIRE_MINUTES',
    ]
    
    for var in critical_vars:
        value = os.getenv(var)
        if value and len(value) > 0:
            masked_value = value[:3] + '***' if len(value) > 3 else '***'
            results.append((var, True, masked_value))
        else:
            results.append((var, False, 'No definida'))
    
    return results

def check_database_connectivity() -> Tuple[bool, str]:
    """Verifica conectividad a la base de datos"""
    env_file = Path('/workspace/backend/.env')
    if env_file.exists():
        load_dotenv(env_file)
    
    database_url = os.getenv('DATABASE_URL', '')
    
    if not database_url:
        return False, 'DATABASE_URL no definida'
    
    # Intentar conectar
    try:
        from sqlalchemy import create_engine, text
        engine = create_engine(database_url)
        with engine.connect() as conn:
            conn.execute(text('SELECT 1'))
        return True, 'Conexión exitosa'
    except Exception as e:
        return False, str(e)

def check_redis_connectivity() -> Tuple[bool, str]:
    """Verifica conectividad a Redis"""
    env_file = Path('/workspace/backend/.env')
    if env_file.exists():
        load_dotenv(env_file)
    
    redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    
    try:
        import redis
        r = redis.from_url(redis_url)
        r.ping()
        return True, 'Conexión exitosa'
    except Exception as e:
        return False, str(e)

def generate_report(results: dict, output_file: str = 'verification_report.json'):
    """Genera un reporte JSON de la verificación"""
    report = {
        'timestamp': subprocess.run(['date', '-Iseconds'], capture_output=True, text=True).stdout.strip(),
        'python_version': f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        'results': results
    }
    
    with open(output_file, 'w') as f:
        json.dump(report, f, indent=2, default=str)
    
    return output_file

def main():
    """Función principal de verificación"""
    print_header("🔍 DELIVERY360 - VERIFICACIÓN DEL SISTEMA")
    
    all_passed = True
    
    # 1. Verificar Python
    print_section("1. Versión de Python")
    python_ok, python_version = check_python_version()
    if python_ok:
        success_check("Python", python_version)
    else:
        error_check("Python", f"Versión {python_version} no cumple requisito mínimo (3.10+)")
        all_passed = False
    
    # 2. Verificar paquetes del sistema
    print_section("2. Paquetes del Sistema")
    system_packages = check_system_packages()
    for name, ok, info in system_packages:
        if ok:
            success_check(name, info)
        else:
            warning_check(name, info)
    
    # 3. Verificar paquetes de Python contra requirements.txt
    print_section("3. Paquetes de Python (requirements.txt)")
    requirements_file = Path('/workspace/backend/requirements.txt')
    
    package_results = []
    problems = []
    
    if requirements_file.exists():
        package_results, problems = check_python_packages(requirements_file)
        
        installed_count = sum(1 for _, ok, _ in package_results if ok)
        total_count = len(package_results)
        
        for package, ok, info in package_results:
            if ok:
                success_check(package, info)
            else:
                error_check(package, info)
                all_passed = False
        
        print(f"\n  {Color.BOLD}Resumen: {installed_count}/{total_count} paquetes verificados correctamente{Color.RESET}")
        
        if problems:
            print(f"\n  {Color.YELLOW}{Color.BOLD}⚠ PROBLEMAS DETECTADOS:{Color.RESET}")
            print(f"  {Color.YELLOW}{'='*60}{Color.RESET}")
            for pkg, installed, required in problems:
                if installed == 'no instalado':
                    print(f"  {Color.RED}✗ {pkg}: No instalado (requerido: {required}){Color.RESET}")
                    print(f"      → Instalar con: pip install {pkg}{Color.RESET}")
                else:
                    print(f"  {Color.YELLOW}⚠ {pkg}: Versión {installed} (requerida: {required}){Color.RESET}")
                    print(f"      → Actualizar con: pip install {pkg}{required}{Color.RESET}")
            
            print(f"\n  {Color.CYAN}💡 Solución rápida:{Color.RESET}")
            print(f"      cd /workspace/backend && pip install -r requirements.txt{Color.RESET}")
    else:
        error_check("requirements.txt", "Archivo no encontrado")
        all_passed = False
    
    # 4. Verificar estructura de directorios
    print_section("4. Estructura del Proyecto")
    dir_results = check_directory_structure()
    for name, ok, info in dir_results:
        if ok:
            success_check(name, info)
        else:
            error_check(name, info)
            all_passed = False
    
    # 5. Verificar variables de entorno
    print_section("5. Variables de Entorno")
    env_results = check_env_variables()
    for name, ok, info in env_results:
        if ok:
            success_check(name, info)
        else:
            warning_check(name, info)
    
    # 6. Verificar conectividad a servicios
    print_section("6. Conectividad a Servicios")
    
    db_ok, db_msg = check_database_connectivity()
    if db_ok:
        success_check("PostgreSQL", db_msg)
    else:
        warning_check("PostgreSQL", db_msg)
    
    redis_ok, redis_msg = check_redis_connectivity()
    if redis_ok:
        success_check("Redis", redis_msg)
    else:
        warning_check("Redis", redis_msg)
    
    # 7. Resumen final
    print_header("📊 RESUMEN FINAL")
    
    if all_passed:
        print(f"\n{Color.GREEN}{Color.BOLD}✅ ¡VERIFICACIÓN EXITOSA!{Color.RESET}")
        print(f"\n{Color.GREEN}El sistema está listo para ejecutarse.{Color.RESET}")
        print(f"\n{Color.CYAN}Próximos pasos:{Color.RESET}")
        print("  1. Ejecutar: cd /workspace/backend && alembic upgrade head")
        print("  2. Ejecutar: uvicorn app.main:app --reload")
        print("  3. Abrir: http://localhost:8000/docs")
    else:
        print(f"\n{Color.RED}{Color.BOLD}❌ VERIFICACIÓN CON ERRORES{Color.RESET}")
        print(f"\n{Color.RED}Se detectaron problemas que deben resolverse antes de continuar.{Color.RESET}")
        print(f"\n{Color.YELLOW}Recomendaciones:{Color.RESET}")
        print("  1. Instalar paquetes faltantes: pip install -r requirements.txt")
        print("  2. Configurar variables de entorno en .env")
        print("  3. Asegurar que PostgreSQL y Redis estén corriendo")
    
    # Generar reporte JSON
    report_data = {
        'python_version': python_version,
        'system_packages': system_packages,
        'python_packages': package_results if 'package_results' in locals() else [],
        'directory_structure': dir_results,
        'env_variables': env_results,
        'database': {'ok': db_ok, 'message': db_msg},
        'redis': {'ok': redis_ok, 'message': redis_msg},
        'all_passed': all_passed
    }
    
    report_file = generate_report(report_data)
    print(f"\n{Color.CYAN}Reporte generado: {report_file}{Color.RESET}\n")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
