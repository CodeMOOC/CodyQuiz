using CodyQuiz.Web.Model;
using Microsoft.Extensions.Configuration;
using RestSharp;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CodyQuiz.Web {

    public class TelegramService {

        private readonly IConfigurationRoot Configuration;

        protected string BotToken {
            get {
                return Configuration["bottoken"];
            }
        }

        protected RestClient Client {
            get {
                return new RestClient($"https://api.telegram.org/bot{BotToken}");
            }
        }

        public TelegramService(IConfigurationRoot conf) {
            Configuration = conf;
        }

        public GetUpdatesResponse GetUpdates(int? offset = null, int? maxNumber = null) {
            var request = new RestRequest("getUpdates");
            request.Method = Method.POST;
            if(offset.HasValue)
                request.AddParameter("offset", offset.Value, ParameterType.QueryString);
            if (maxNumber.HasValue)
                request.AddParameter("limit", maxNumber.Value.ToString());

            var response = Client.Execute<GetUpdatesResponse>(request);
            if (!response.IsSuccessful)
                throw new Exception(response.ErrorMessage, response.ErrorException);

            return response.Data;
        }

    }

}
