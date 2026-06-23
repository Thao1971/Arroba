def round_financial_display(value: float) -> str:
    """Round financial values for public display"""
    if value >= 1_000_000:
        rounded = round(value / 1_000_000, 1)
        return f"{rounded}M €"
    elif value >= 1_000:
        rounded = round(value / 1_000)
        return f"{rounded}k €"
    else:
        return f"{int(value)} €"

def round_to_range(value: float, percentage: float = 0.15) -> tuple:
    """Round a value to a range for display"""
    lower = value * (1 - percentage)
    upper = value * (1 + percentage)
    return (lower, upper)

def generate_acronym(company_name: str, year: int = None) -> str:
    """Generate an acronym for a company"""
    import random
    # Take first letters of words
    words = company_name.split()[:3]
    acronym = ''.join([w[0].upper() for w in words if w])
    if len(acronym) < 3:
        acronym = acronym.ljust(3, 'X')
    
    year_suffix = str(year)[-2:] if year else str(random.randint(20, 26))
    seq = str(random.randint(1, 999)).zfill(3)
    
    return f"{acronym}-{year_suffix}-{seq}"

def calculate_ebitda_margin(ebitda: float, revenue: float) -> float:
    """Calculate EBITDA margin"""
    if revenue == 0:
        return 0
    return round((ebitda / revenue) * 100, 2)

def calculate_growth_rate(current: float, previous: float) -> float:
    """Calculate year-over-year growth rate"""
    if previous == 0:
        return 0
    return round(((current - previous) / previous) * 100, 2)
