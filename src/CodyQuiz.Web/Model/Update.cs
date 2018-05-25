using RestSharp.Deserializers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CodyQuiz.Web.Model {

    public class Update {

        [DeserializeAs(Name = "update_id")]
        public int Id { get; set; }

        public Message Message { get; set; }

    }

}
