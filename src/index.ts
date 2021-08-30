import ActivityExtension from "./Extensions/ActivityExtension";
import AdministrativeExtension from "./Extensions/AdministrativeExtension";
import FunExtension from "./Extensions/FunExtension";
import UtilityExtension from "./Extensions/UtilityExtension";
import Merari from "./Merari/Merari";

const bot = new Merari();

bot.extensionManager.add(ActivityExtension)
bot.extensionManager.add(FunExtension);
bot.extensionManager.add(AdministrativeExtension)
bot.extensionManager.add(UtilityExtension)

bot.run();