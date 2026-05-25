from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.modules.workshop.models import WorkShop, Branch, ProductionTeam


class WorkshopService:

    @staticmethod
    async def get_workshop_hierarchy(db: AsyncSession) -> List[Dict[str, Any]]:
        """Get nested workshop -> branch -> production_team hierarchy"""
        workshops_result = await db.execute(select(WorkShop))
        workshops = workshops_result.scalars().all()

        branches_result = await db.execute(select(Branch))
        branches = branches_result.scalars().all()

        teams_result = await db.execute(select(ProductionTeam))
        teams = teams_result.scalars().all()

        # Group branches by workshop_code
        branches_by_workshop: Dict[str, List[Branch]] = {}
        for branch in branches:
            if branch.workshop_code not in branches_by_workshop:
                branches_by_workshop[branch.workshop_code] = []
            branches_by_workshop[branch.workshop_code].append(branch)

        # Group teams by branch_code
        teams_by_branch: Dict[str, List[ProductionTeam]] = {}
        for team in teams:
            if team.branch_code not in teams_by_branch:
                teams_by_branch[team.branch_code] = []
            teams_by_branch[team.branch_code].append(team)

        result: List[Dict[str, Any]] = []
        for workshop in workshops:
            ws_branches = branches_by_workshop.get(workshop.workshop_code, [])
            branch_list = []
            for branch in ws_branches:
                br_teams = teams_by_branch.get(branch.branch_code, [])
                team_list = [
                    {
                        "branchCode": team.branch_code,
                        "productionTeamCode": team.production_team_code,
                        "productionTeamName": team.production_team_name
                    }
                    for team in br_teams
                ]
                branch_list.append({
                    "workshopCode": branch.workshop_code,
                    "branchCode": branch.branch_code,
                    "branchName": branch.branch_name,
                    "productionTeams": team_list
                })

            result.append({
                "workshopCode": workshop.workshop_code,
                "workShopName": workshop.workshop_name,
                "description": workshop.description,
                "branchs": branch_list
            })

        return result
