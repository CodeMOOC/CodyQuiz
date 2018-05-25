using RestSharp.Deserializers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CodyQuiz.Web.Model {

    public class GetUpdatesResponse {

        public bool Ok { get; set; }

        [DeserializeAs(Name = "result")]
        public List<Update> Updates { get; set; }

    }

}
