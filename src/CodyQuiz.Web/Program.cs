using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace CodyQuiz.Web {

    public class Program {
        public static void Main(string[] args) {
            var confBuilder = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json", false, false);
            if ("Development" == Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")) {
                confBuilder.AddJsonFile("appsettings.development.json", true, false);
            }
            confBuilder.AddEnvironmentVariables();
            var conf = confBuilder.Build();

            if (args.Length >= 1 && string.Compare(args[0], "pull", true) == 0) {
                Console.WriteLine("Launching in pull mode...");
                var service = new TelegramService(conf);
                var updates = service.GetUpdates();
                foreach(var u in updates.Updates) {
                    Console.WriteLine("#{0} #{1} {2} {3}", u.Id, u.Message.Id, u.Message.Date, u.Message.Text);
                }

                Console.Read();
            }
            else {
                BuildWebHost(args).Run();
            }
        }

        public static IWebHost BuildWebHost(string[] args) =>
            WebHost.CreateDefaultBuilder(args)
                .UseStartup<Startup>()
                .Build();
    }

}
