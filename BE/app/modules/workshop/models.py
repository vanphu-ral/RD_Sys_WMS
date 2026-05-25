from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class WorkShop(Base):
    __tablename__ = "workshop"
    workshop_code = Column(String(15), primary_key=True)
    workshop_name = Column(String(50))
    description = Column(String(255), nullable=True)

    branches = relationship(
        "Branch",
        primaryjoin="WorkShop.workshop_code == Branch.workshop_code",
        back_populates="workshop",
        viewonly=True
    )


class Branch(Base):
    __tablename__ = "branch"
    workshop_code = Column(String(15), ForeignKey("workshop.workshop_code")) 
    
    branch_code = Column(String(15), primary_key=True)
    branch_name = Column(String(50))

    workshop = relationship(
        "WorkShop",
        primaryjoin="Branch.workshop_code == WorkShop.workshop_code",
        back_populates="branches",
        viewonly=True
    )
    production_teams = relationship(
        "ProductionTeam",
        primaryjoin="Branch.branch_code == ProductionTeam.branch_code",
        back_populates="branch",
        viewonly=True
    )


class ProductionTeam(Base):
    __tablename__ = "production_team"
    
    branch_code = Column(String(15), ForeignKey("branch.branch_code")) 
    
    production_team_code = Column(String(15), primary_key=True)
    production_team_name = Column(String(50))

    branch = relationship(
        "Branch",
        primaryjoin="ProductionTeam.branch_code == Branch.branch_code",
        back_populates="production_teams",
        viewonly=True
    )